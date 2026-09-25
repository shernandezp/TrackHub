#!/bin/bash
# =============================================================================
# TrackHub Deployment Script
# =============================================================================
# Main deployment script for TrackHub application stack
# Usage: ./deploy.sh [full|frontend|backend] [--build|--pull] [--no-cache]
# Builds use Docker layer caching by default and reliably detect source changes.
# Containers are always force recreated so updated images are deployed.
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Source repository settings (GITHUB_OWNER / GITHUB_REPO / credentials)
source "$SCRIPT_DIR/repo-config.sh"


export COMPOSE_BAKE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOYMENT_TYPE="full"
BUILD_TYPE="--build"
SKIP_INIT=false
NO_CACHE=false

print_header() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  TrackHub Deployment Script"
    echo "=============================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

usage() {
    echo "Usage: $0 [deployment_type] [options]"
    echo ""
    echo "Deployment Types:"
    echo "  full      - Deploy frontend and all backend services (default)"
    echo "  portal    - Rebuild only the portal on a full-stack server (nothing else is touched)"
    echo "  frontend  - Deploy only the frontend (split deployment: frontend-only server)"
    echo "  backend   - Deploy only the backend services (split deployment: backend-only server)"
    echo ""
    echo "Options:"
    echo "  --build     - Build images locally using Docker layer cache (default)"
    echo "  --pull      - Pull images from registry"
    echo "  --no-cache  - Force a full rebuild ignoring the Docker layer cache"
    echo "                (rarely needed; normal builds already detect source changes)"
    echo "  --skip-init - Skip database initialization (for migrations)"
    echo "  --skip-git-check - Deploy even if this checkout is behind its upstream"
    echo "  --help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 full --build"
    echo "  $0 portal"
    echo "  $0 frontend"
    echo "  $0 backend --build"
    echo "  $0 full --build --skip-init  # For migrating to new server"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    print_success "Docker daemon is running"
}

# Building is the step that takes a host down: a dozen .NET restores in parallel exhaust
# memory and, on Azure, the VM's outbound SNAT ports (NuGet then fails with TLS EOFs and
# 100 s timeouts). Everything here fails in seconds instead of hours.
check_build_capacity() {
    print_info "Checking build capacity..."

    local docker_root avail_gb avail_mb swap_mb
    docker_root=$(docker info -f '{{.DockerRootDir}}' 2>/dev/null || echo /var/lib/docker)
    avail_gb=$(df -BG --output=avail "$docker_root" | tail -1 | tr -dc '0-9')
    if [ "${avail_gb:-0}" -lt 10 ]; then
        print_error "Only ${avail_gb} GB free under $docker_root; image builds need at least 10 GB."
        print_error "Run: docker builder prune -f && docker image prune -f"
        exit 1
    fi
    print_success "Disk: ${avail_gb} GB free"

    avail_mb=$(free -m | awk '/^Mem:/ {print $7}')
    swap_mb=$(free -m | awk '/^Swap:/ {print $2}')
    if [ "${avail_mb:-0}" -lt 1536 ]; then
        print_error "Only ${avail_mb} MB of memory available; a .NET image build needs 1.5 GB or more."
        exit 1
    fi
    if [ "${swap_mb:-0}" -eq 0 ]; then
        print_warning "No swap configured: a build spike cannot be absorbed (see INSTALL.md, Server Requirements)"
    fi
    print_success "Memory: ${avail_mb} MB available, ${swap_mb} MB swap"

    if ! curl -fsS -m 15 -o /dev/null https://api.nuget.org/v3/index.json; then
        print_error "nuget.org is unreachable or too slow from this host; every restore would time out."
        print_error "Check outbound connectivity, then retry."
        exit 1
    fi
    print_success "nuget.org reachable"
}

# One image at a time. COMPOSE_PARALLEL_LIMIT does not bound "docker compose build", and
# every Dockerfile shares one BuildKit NuGet cache, so serial builds also download each
# package once instead of once per image.
build_images() {
    local no_cache=()
    [ "$NO_CACHE" = true ] && no_cache=(--no-cache)
    local svc
    while IFS= read -r svc; do
        [ -z "$svc" ] && continue
        print_info "Building $svc..."
        docker compose -f "$COMPOSE_FILE" build "${no_cache[@]}" "$svc"
    done < <(docker compose -f "$COMPOSE_FILE" config --services)
}

# Superseded layers and images otherwise accumulate until the disk is full. The kept
# storage covers the layer cache of the current images plus the shared NuGet cache.
prune_build_leftovers() {
    print_info "Pruning superseded images and build cache..."
    docker image prune -f > /dev/null || true
    docker builder prune -f --keep-storage 15G > /dev/null || true
}

# The compose files and this script ARE deployment inputs: deploying from a stale
# checkout silently recreates every container with outdated env mappings (a class of
# failure that only surfaces at runtime, e.g. a service identity that was never
# injected). Refuse to deploy when the checkout is behind its upstream.
check_deployment_freshness() {
    print_info "Checking deployment checkout freshness..."

    if [ "$SKIP_GIT_CHECK" = true ]; then
        print_warning "Skipping deployment checkout freshness check (--skip-git-check)"
        return 0
    fi

    # The .git directory lives at the monorepo root, not in this folder: resolve the checkout root.
    local repo_root
    if ! command -v git &> /dev/null; then
        print_warning "git is not installed; cannot verify this checkout is current"
        return 0
    fi
    repo_root="$(git -C "$PROJECT_DIR" rev-parse --show-toplevel 2>/dev/null)"
    if [ -z "$repo_root" ]; then
        print_warning "Deployment folder is not a git checkout; cannot verify it is current"
        return 0
    fi

    # Never prompt for credentials here: an unreachable/unauthenticated remote is a
    # warning, not a blocker (the server may deploy while offline).
    if ! GIT_TERMINAL_PROMPT=0 git -C "$repo_root" fetch --quiet 2>/dev/null; then
        print_warning "Could not reach the deployment repo remote; skipping freshness check"
        return 0
    fi

    local behind
    behind="$(git -C "$repo_root" rev-list --count 'HEAD..@{upstream}' 2>/dev/null || echo 0)"
    if [ "${behind:-0}" -gt 0 ]; then
        print_error "This deployment checkout is $behind commit(s) behind its upstream."
        print_info "The compose files/scripts about to be used are OUTDATED. Update first:"
        print_info "  git -C $repo_root pull"
        print_info "Or re-run with --skip-git-check to deploy the old configuration anyway."
        exit 1
    fi
    print_success "Deployment checkout is up to date with its upstream"
}

check_configuration() {
    print_info "Checking configuration files..."
    
    # Check .env file
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        print_error ".env file not found!"
        print_info "Copy .env.example to .env and configure it:"
        print_info "  cp .env.example .env"
        print_info "  nano .env"
        exit 1
    fi
    print_success ".env file exists"

    # These keys have no defaults in the compose files; an empty or placeholder value deploys a
    # Telemetry service with no connection string and service clients that cannot authenticate.
    # .env is grepped rather than sourced: values may contain shell metacharacters.
    if [ "$DEPLOYMENT_TYPE" != "frontend" ] && [ "$DEPLOYMENT_TYPE" != "portal" ]; then
        local required_keys=(
            DB_CONNECTION_TELEMETRY
            SYNCWORKER_CLIENT_SECRET
            ROUTER_CLIENT_SECRET
            SECURITY_CLIENT_SECRET
            GEOFENCE_CLIENT_SECRET
            TRIP_CLIENT_SECRET
            REPORTING_CLIENT_SECRET
        )
        local missing=()
        local key value
        for key in "${required_keys[@]}"; do
            value="$(grep -E "^${key}=" "$PROJECT_DIR/.env" | tail -n 1 | cut -d= -f2-)"
            case "$value" in
                ""|your-*) missing+=("$key") ;;
            esac
        done
        if [ ${#missing[@]} -gt 0 ]; then
            print_error "Missing or placeholder values in .env: ${missing[*]}"
            print_info "These keys have no defaults — set real values in $PROJECT_DIR/.env"
            print_info "(the *_CLIENT_SECRET values must match config/clients.json)"
            exit 1
        fi
        print_success "Required .env values are set"
    fi
    
    # Check certificates
    if [ ! -f "$PROJECT_DIR/certificates/certificate.pfx" ]; then
        print_warning "OpenIddict certificate not found at certificates/certificate.pfx"
        print_info "Please place your certificate file before starting services"
    else
        print_success "OpenIddict certificate found"
    fi
    
    # Check SSL certificates
    if [ ! -f "$PROJECT_DIR/certificates/fullchain.pem" ] || [ ! -f "$PROJECT_DIR/certificates/privkey.pem" ]; then
        print_warning "SSL certificates not found"
        print_info "Please place fullchain.pem and privkey.pem in the certificates folder"
    else
        print_success "SSL certificates found"
    fi
    
    # Check clients.json for database initialization
    if [ ! -f "$PROJECT_DIR/config/clients.json" ]; then
        print_warning "clients.json not found at config/clients.json"
        print_info "Copy config/clients.json.example to config/clients.json and configure it"
    else
        print_success "clients.json found"
    fi
}

select_compose_file() {
    case $DEPLOYMENT_TYPE in
        "full"|"portal")
            COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
            ;;
        "frontend")
            COMPOSE_FILE="$PROJECT_DIR/docker-compose.frontend.yml"
            ;;
        "backend")
            COMPOSE_FILE="$PROJECT_DIR/docker-compose.backend.yml"
            ;;
        *)
            print_error "Invalid deployment type: $DEPLOYMENT_TYPE"
            usage
            exit 1
            ;;
    esac
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    print_info "Using compose file: $COMPOSE_FILE"
}

check_split_target() {
    # The split compose files describe half a stack. On a host that runs the other half in
    # the same compose project, "down --remove-orphans" deletes that half and the split nginx
    # config has no routes for it, so every API path serves index.html and sign-in loops.
    local other
    case $DEPLOYMENT_TYPE in
        frontend) other="trackhub-manager" ;;
        backend)  other="trackhub-frontend" ;;
        *) return 0 ;;
    esac
    if docker ps -a --format '{{.Names}}' | grep -qx "$other"; then
        print_error "'$DEPLOYMENT_TYPE' is for a split deployment, but this host runs the full stack ($other exists)."
        print_info "Use '$0 portal' to redeploy only the portal, or '$0 full --skip-init' for everything."
        exit 1
    fi
}

ensure_source_repo() {
    # Every image builds from the monorepo root, so each source directory must be present there;
    # a missing one otherwise surfaces deep inside "docker compose build" as a cache-key error.
    local repo="$1" target="$2"
    [ -d "$target" ] && return 0
    print_error "$repo is missing from this checkout ($(dirname "$target"))"
    print_info "Re-sync the checkout: ./scripts/clone-repos.sh"
    exit 1
}

ensure_source_repos() {
    local workspace_dir repo
    workspace_dir="$(dirname "$PROJECT_DIR")"

    if [ "$DEPLOYMENT_TYPE" = "frontend" ] || [ "$DEPLOYMENT_TYPE" = "portal" ]; then
        ensure_source_repo "TrackHub.Portal" "$workspace_dir/TrackHub.Portal"
        return 0
    fi

    for repo in "${TRACKHUB_REPOS[@]}"; do
        [ "$repo" = "TrackHub.Portal" ] && [ "$DEPLOYMENT_TYPE" = "backend" ] && continue
        ensure_source_repo "$repo" "$workspace_dir/$repo"
    done
}

ensure_generated_config() {
    # Backend services read their configuration from generated/appsettings.<service>.json,
    # which compose bind-mounts read-only over each container's /app/appsettings.json.
    # Regenerate from .env so the mounted configs reflect the current environment.
    if [ -f "$PROJECT_DIR/.env" ]; then
        print_info "Generating service configs into generated/ from .env..."
        "$SCRIPT_DIR/sync-config.sh" generate
        print_success "Service configs generated"
    elif [ -z "$(ls -A "$PROJECT_DIR/generated" 2>/dev/null)" ]; then
        print_error "No .env file found and generated/ is empty."
        print_error "Create $PROJECT_DIR/.env (cp .env.example .env) and configure it before deploying."
        exit 1
    else
        print_warning "No .env file found — deploying with the existing generated/ configs."
    fi
}

tag_rollback_point() {
    # Preserve every image this deployment is about to overwrite.
    # "docker compose build" rebuilds "<project>-<service>:latest" in place; the outgoing
    # image keeps no tag and becomes dangling, so without this step the deployment being
    # replaced right now is unrecoverable and ./rollback.sh has nothing to roll back to.
    # ":previous" is a one-step safety net — keep using "rollback.sh tag <service> <version>"
    # for named releases you want to keep across several deployments.
    # rollback.sh owns the compose image-name resolution; call it rather than re-deriving
    # the project name here. It exits non-zero on a service with no :latest yet (first
    # deployment), which is not an error. nginx is skipped: it runs an upstream image.
    print_info "Preserving current images as :previous (rollback point)..."
    local svc
    while IFS= read -r svc; do
        [ -z "$svc" ] && continue
        [ "$svc" = "nginx" ] && continue
        "$SCRIPT_DIR/rollback.sh" tag "$svc" previous "$COMPOSE_FILE" > /dev/null 2>&1 \
            || print_warning "No current image for $svc — nothing to roll back to"
    done < <(docker compose -f "$COMPOSE_FILE" config --services)
}

deploy_portal() {
    # Rebuild and recreate only the portal image and nginx (its upstream volume consumer).
    # No "down", no db-init, no other service is recreated.
    print_info "Rebuilding the portal..."
    cd "$PROJECT_DIR"
    "$SCRIPT_DIR/rollback.sh" tag frontend previous "$COMPOSE_FILE" > /dev/null 2>&1 \
        || print_warning "No current image for frontend — nothing to roll back to"
    if [ "$NO_CACHE" = true ]; then
        docker compose -f "$COMPOSE_FILE" build --no-cache frontend
    else
        docker compose -f "$COMPOSE_FILE" build frontend
    fi
    docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-build --no-deps frontend
    docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-build --no-deps nginx
    print_success "Portal deployment complete!"
}

deploy() {
    if [ "$DEPLOYMENT_TYPE" = "portal" ]; then
        deploy_portal
        return 0
    fi

    print_info "Starting deployment..."

    cd "$PROJECT_DIR"

    # Backend/full deployments need the generated service configs the compose files mount.
    if [ "$DEPLOYMENT_TYPE" != "frontend" ]; then
        ensure_generated_config
    fi

    # Build or pull images FIRST, while the current stack keeps running.
    # The stack is only taken down once new images exist, so a failed build
    # leaves the running deployment untouched.
    docker compose -f "$COMPOSE_FILE" config -q
    if [ "$BUILD_TYPE" == "--build" ]; then
        ensure_source_repos
        check_build_capacity
        tag_rollback_point
        build_images
    else
        print_info "Pulling images..."
        docker compose -f "$COMPOSE_FILE" pull
    fi

    # Stop existing containers
    print_info "Stopping existing containers..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans || true

    # Start services
    if [ "$SKIP_INIT" = true ]; then
        print_warning "Skipping database initialization (--skip-init flag set)"
        print_info "Starting services without db-init..."

        # Derive the service list from the compose file in use so that --skip-init
        # works for every compose file. Never fall back to a command that would
        # start db-init (it runs the one-time destructive User/Account ID sync).
        local services=()
        local nginx_services=()
        while IFS= read -r svc; do
            [ -z "$svc" ] && continue
            [ "$svc" = "db-init" ] && continue
            if [ "$svc" = "nginx" ]; then
                nginx_services+=("$svc")
            else
                services+=("$svc")
            fi
        done < <(docker compose -f "$COMPOSE_FILE" config --services)

        if [ ${#services[@]} -eq 0 ] && [ ${#nginx_services[@]} -eq 0 ]; then
            print_error "Could not determine the service list from $COMPOSE_FILE"
            print_error "Refusing to start the stack, as that would also run db-init."
            exit 1
        fi

        # --no-deps is mandatory here: "authority" declares
        #   depends_on: db-init { condition: service_completed_successfully }
        # so any dependency-resolving "up" would start db-init - exactly what
        # --skip-init must prevent. The tradeoff is that Compose no longer orders the
        # listed services either, so we restore the one ordering that actually matters
        # by hand: nginx is started last. Nginx resolves every upstream host at config
        # load and dies with "host not found in upstream" when the API containers do
        # not exist yet. The APIs themselves tolerate any start order (they retry their
        # dependencies), so two waves are enough.
        if [ ${#services[@]} -gt 0 ]; then
            print_info "Services: ${services[*]}"
            docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-build --no-deps "${services[@]}"
        fi

        if [ ${#nginx_services[@]} -gt 0 ]; then
            print_info "Starting nginx last (upstreams must exist first)..."
            docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-build --no-deps "${nginx_services[@]}"
        fi
    else
        print_info "Starting all services..."
        docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-build
    fi

    if [ "$BUILD_TYPE" == "--build" ]; then
        prune_build_leftovers
    fi
    
    print_success "Deployment complete!"
}

show_status() {
    print_info "Service Status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    print_info "To view logs, run:"
    echo "  docker compose -f $COMPOSE_FILE logs -f"
    echo ""
    print_info "To check health endpoints:"
    echo "  curl -k https://localhost/health"
    echo "  curl -k https://localhost/health/authority"
    echo "  curl -k https://localhost/health/security"
    echo "  curl -k https://localhost/health/manager"
    echo "  curl -k https://localhost/health/router"
    echo "  curl -k https://localhost/health/geofencing"
    echo "  curl -k https://localhost/health/trip"
    echo "  curl -k https://localhost/health/telemetry"
    echo "  curl -k https://localhost/health/reporting"
    echo ""
    print_info "Or open the platform status page (works without signing in):"
    echo "  https://localhost/status"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        full|portal|frontend|backend)
            DEPLOYMENT_TYPE="$1"
            shift
            ;;
        --build|--pull)
            BUILD_TYPE="$1"
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --skip-init)
            SKIP_INIT=true
            shift
            ;;
        --skip-git-check)
            SKIP_GIT_CHECK=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
print_header
check_prerequisites
check_deployment_freshness
check_configuration
select_compose_file
check_split_target
deploy
show_status
