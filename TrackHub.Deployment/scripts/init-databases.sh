#!/bin/bash
# =============================================================================
# TrackHub Database Initialization Script
# =============================================================================
# Runs on every deploy (new installations AND updates). It performs:
#   1. ClientSeeder            - OpenIddict scopes + OAuth clients (idempotent upsert)
#   2. Security DBInitializer  - security resources/roles/service-client seed (idempotent)
#   3. Manager DBInitializer   - master data seed: reports, transporter types, etc. (idempotent)
#
# Every step is safe to re-run: the seeders upsert / guard every insert with an
# existence check, so on updates they simply add anything new (e.g. newly
# introduced OAuth clients or permission resources) and leave existing data
# untouched. The seeded administrator and master account carry the well-known
# PlatformBootstrap ids in both databases, so no cross-database id sync exists.
#
# NOTE: EF schema migrations ("DB updates") are applied separately from this
# script (the seeders assume the schema already exists). See INSTALL.md ->
# "Applying Migrations". ClientSeeder creates the OpenIddict tables it needs via
# EnsureCreated.
# =============================================================================

set -e

# Colors / logging helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ $1${NC}"; }

echo "=========================================="
echo "Starting TrackHub Database Initialization"
echo "=========================================="

# Wait for database to be ready
wait_for_db() {
    local connection_string=$1
    local db_name=$2

    echo "Waiting for $db_name database to be ready..."

    # Extract host and port from connection string
    local host
    local port
    host=$(echo "$connection_string" | grep -oP 'server=\K[^;]+')
    port=$(echo "$connection_string" | grep -oP 'port=\K[^;]+')
    port=${port:-5432}

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$host" -p "$port" > /dev/null 2>&1; then
            echo "$db_name database is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $db_name database not ready yet..."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo "ERROR: $db_name database did not become ready in time"
    return 1
}

# Wait for database
wait_for_db "$DB_CONNECTION_SECURITY" "Security"

# -----------------------------------------------------------------------------
# Step 0: the logging database (idempotent)
# -----------------------------------------------------------------------------
# The Serilog sink creates its TABLE but never its database. Logs live in their own database so a
# burst of warnings during an incident competes for nothing the fleet queries need.
ensure_database() {
    local connection_string=$1
    local host port user pass db

    host=$(echo "$connection_string" | grep -oP 'server=\K[^;]+')
    port=$(echo "$connection_string" | grep -oP 'port=\K[^;]+'); port=${port:-5432}
    user=$(echo "$connection_string" | grep -oP 'user id=\K[^;]+')
    pass=$(echo "$connection_string" | grep -oP 'password=\K[^;]+')
    db=$(echo "$connection_string" | grep -oP 'database=\K[^;]+')

    if [ -z "$db" ]; then
        print_warning "No database named in the connection string; skipping."
        return 0
    fi

    if PGPASSWORD="$pass" psql -h "$host" -p "$port" -U "$user" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1; then
        print_info "Database $db already exists."
        return 0
    fi

    PGPASSWORD="$pass" psql -h "$host" -p "$port" -U "$user" -d postgres -c "CREATE DATABASE \"$db\"" \
        && print_success "Created database $db." \
        || { print_error "Could not create database $db"; return 1; }
}

if [ -n "${DB_CONNECTION_LOGGING:-}" ]; then
    echo ""
    echo "=========================================="
    echo "Step 0: Ensuring the logging database"
    echo "=========================================="
    ensure_database "$DB_CONNECTION_LOGGING"
fi

# -----------------------------------------------------------------------------
# Step 1: ClientSeeder (idempotent - runs every deploy)
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "Step 1: Running ClientSeeder"
echo "=========================================="
cd /app/client-seeder

# Update connection string in appsettings
cat > appsettings.json << EOF
{
  "ConnectionStrings": {
    "Security": "$DB_CONNECTION_SECURITY"
  }
}
EOF

# Copy clients.json if provided
if [ -f "/app/clients.json" ]; then
    cp /app/clients.json ./clients.json
    echo "Using provided clients.json"
else
    echo "WARNING: No clients.json provided. Using default configuration."
fi

dotnet TrackHub.AuthorityServer.ClientSeeder.dll || { print_error "ClientSeeder failed"; exit 1; }
print_success "ClientSeeder completed successfully!"

# -----------------------------------------------------------------------------
# Step 2: Security DBInitializer (idempotent - runs every deploy)
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "Step 2: Running Security DBInitializer"
echo "=========================================="
cd /app/security-init

cat > appsettings.json << EOF
{
  "ConnectionStrings": {
    "Security": "$DB_CONNECTION_SECURITY"
  }
}
EOF

dotnet TrackHub.Security.DBInitializer.dll || { print_error "Security DBInitializer failed"; exit 1; }
print_success "Security DBInitializer completed successfully!"

# -----------------------------------------------------------------------------
# Step 3: Manager DBInitializer (idempotent - runs every deploy)
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "Step 3: Running Manager DBInitializer"
echo "=========================================="
cd /app/manager-init

cat > appsettings.json << EOF
{
  "ConnectionStrings": {
    "DefaultConnection": "$DB_CONNECTION_MANAGER"
  }
}
EOF

dotnet TrackHub.Manager.DBInitializer.dll || { print_error "Manager DBInitializer failed"; exit 1; }
print_success "Manager DBInitializer completed successfully!"

echo ""
echo "=========================================="
echo "Seeding Complete!"
echo "=========================================="
echo ""

# -----------------------------------------------------------------------------
# Step 3b: UTC session time zone on every database (idempotent - runs every deploy)
# -----------------------------------------------------------------------------
# The services pin their own sessions to UTC; this covers psql, cron and every hand-run script so
# no result ever depends on the host's zone.
pin_utc_timezone() {
    local connection_string=$1
    local host port user pass db

    host=$(echo "$connection_string" | grep -oP 'server=\K[^;]+')
    port=$(echo "$connection_string" | grep -oP 'port=\K[^;]+'); port=${port:-5432}
    user=$(echo "$connection_string" | grep -oP 'user id=\K[^;]+')
    pass=$(echo "$connection_string" | grep -oP 'password=\K[^;]+')
    db=$(echo "$connection_string" | grep -oP 'database=\K[^;]+')
    [ -z "$db" ] && return 0

    if PGPASSWORD="$pass" psql -h "$host" -p "$port" -U "$user" -d "$db" -q \
        -c "ALTER DATABASE \"$db\" SET timezone TO 'UTC'"; then
        print_success "Database $db: session time zone pinned to UTC."
    else
        print_warning "Could not pin the time zone of $db (needs its owner or a superuser); sessions keep the server default."
    fi
}

echo ""
echo "=========================================="
echo "Step 3b: Pinning database time zones to UTC"
echo "=========================================="
for conn in "$DB_CONNECTION_SECURITY" "$DB_CONNECTION_MANAGER" "${DB_CONNECTION_LOGGING:-}"; do
    [ -n "$conn" ] && pin_utc_timezone "$conn"
done

echo ""
print_success "Initialization complete."
