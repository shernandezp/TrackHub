#!/bin/bash
# =============================================================================
# SSL Certificate Generation Script
# =============================================================================
# Obtains SSL certificates from Let's Encrypt via Certbot
# Also generates the OpenIddict certificate for the Authority Server
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CERT_DIR="$PROJECT_DIR/certificates"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

# Parameters: <domain> [email] [openiddict_password] [--rotate-openiddict]
ROTATE_OPENIDDICT=false
POSITIONAL=()
for arg in "$@"; do
    case "$arg" in
        --rotate-openiddict) ROTATE_OPENIDDICT=true ;;
        *) POSITIONAL+=("$arg") ;;
    esac
done
DOMAIN="${POSITIONAL[0]:-$DOMAIN}"
EMAIL="${POSITIONAL[1]:-$LETSENCRYPT_EMAIL}"
export OPENIDDICT_PASSWORD="${POSITIONAL[2]:-${CERTIFICATE_PASSWORD:-}}"

if [ -z "$OPENIDDICT_PASSWORD" ]; then
    print_error "CERTIFICATE_PASSWORD is required: set it in .env (it protects the token-signing key)."
    exit 1
fi


if [ -z "$DOMAIN" ]; then
    print_error "Domain is required. Usage: $0 <domain> [email] [openiddict_password] [--rotate-openiddict]"
    print_info "Or set DOMAIN in your .env file"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    print_error "Email is required for Let's Encrypt. Usage: $0 <domain> <email>"
    print_info "Or set LETSENCRYPT_EMAIL in your .env file"
    exit 1
fi

print_info "Obtaining Let's Encrypt SSL certificate for: $DOMAIN"

mkdir -p "$CERT_DIR"

# =============================================================================
# Install Certbot if not present
# =============================================================================
if ! command -v certbot &> /dev/null; then
    print_info "Installing certbot..."
    apt-get update -qq
    apt-get install -y -qq certbot > /dev/null
    print_success "Certbot installed"
fi

# =============================================================================
# Obtain Let's Encrypt certificate
# =============================================================================
print_info "Requesting certificate from Let's Encrypt..."

# Check if nginx is running — use webroot mode; otherwise use standalone
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q trackhub-nginx; then
    print_info "Nginx is running, using webroot method..."

    # Nginx serves the ACME challenge from the ./certbot/webroot bind mount,
    # so certbot must write the challenge files there (same path renew-ssl.sh uses).
    WEBROOT="$PROJECT_DIR/certbot/webroot"
    mkdir -p "$WEBROOT"

    certbot certonly \
        --webroot \
        -w "$WEBROOT" \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring
else
    print_info "Nginx is not running, using standalone method..."

    certbot certonly \
        --standalone \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring
fi

# =============================================================================
# Copy certificates to project directory
# =============================================================================
LETSENCRYPT_DIR="/etc/letsencrypt/live/$DOMAIN"

if [ -d "$LETSENCRYPT_DIR" ]; then
    cp "$LETSENCRYPT_DIR/fullchain.pem" "$CERT_DIR/"
    cp "$LETSENCRYPT_DIR/privkey.pem" "$CERT_DIR/"
    chmod 644 "$CERT_DIR/fullchain.pem"
    chmod 600 "$CERT_DIR/privkey.pem"
    print_success "Let's Encrypt certificates copied to $CERT_DIR"
else
    print_error "Let's Encrypt certificate directory not found: $LETSENCRYPT_DIR"
    exit 1
fi

# =============================================================================
# OpenIddict certificate (self-signed; signs and encrypts every token)
# =============================================================================
# Replacing it invalidates every issued token and signs every user out, so an existing certificate
# is kept and only checked; --rotate-openiddict replaces it deliberately.
cd "$CERT_DIR"

if [ -f certificate.pfx ] && [ "$ROTATE_OPENIDDICT" != true ]; then
    if openssl pkcs12 -in certificate.pfx -passin env:OPENIDDICT_PASSWORD -noout 2> /dev/null; then
        print_success "OpenIddict certificate kept: certificate.pfx opens with CERTIFICATE_PASSWORD"
    else
        print_error "certificate.pfx does not open with CERTIFICATE_PASSWORD; fix the password or rerun with --rotate-openiddict."
        exit 1
    fi
else
    [ -f certificate.pfx ] && print_warning "Rotating the OpenIddict certificate: every user will have to sign in again."
    print_info "Generating OpenIddict certificate..."
    (
        umask 077
        openssl req -x509 -newkey rsa:4096 -keyout openiddict.key -out openiddict.crt \
            -days 7300 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=TrackHub OpenIddict"
        openssl pkcs12 -export -out certificate.pfx -inkey openiddict.key -in openiddict.crt \
            -passout env:OPENIDDICT_PASSWORD
        rm -f openiddict.key openiddict.crt
    )
    print_success "OpenIddict certificate generated: certificate.pfx"
fi


# =============================================================================
# Setup auto-renewal cron job
# =============================================================================
RENEW_SCRIPT="$PROJECT_DIR/scripts/renew-ssl.sh"
CRON_JOB="0 3 * * * $RENEW_SCRIPT >> /var/log/trackhub-ssl-renewal.log 2>&1"

if ! crontab -l 2>/dev/null | grep -qF "$RENEW_SCRIPT"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    print_success "Auto-renewal cron job added (runs daily at 3 AM)"
else
    print_info "Auto-renewal cron job already exists"
fi

print_success "Certificate setup complete!"
echo ""
print_info "Generated files in $CERT_DIR:"
ls -la "$CERT_DIR"
echo ""
print_info "SSL Certificate files (Let's Encrypt):"
echo "  - fullchain.pem (Nginx SSL certificate)"
echo "  - privkey.pem (Nginx SSL private key)"
echo ""
print_info "OpenIddict Certificate:"
echo "  - certificate.pfx (protected by CERTIFICATE_PASSWORD)"
echo ""
print_info "Certificates will auto-renew via cron. Check logs at /var/log/trackhub-ssl-renewal.log"
