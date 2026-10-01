#!/bin/bash
# =============================================================================
# TrackHub Backup Script
# =============================================================================
# Backs up everything a rebuilt host needs besides the databases (backup-database.sh covers those):
# configuration, certificates and locally stored documents.
# =============================================================================

set -eo pipefail

# The archive holds the installation's credentials.
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

if [ ! -f "$PROJECT_DIR/.env" ]; then
    print_error "No .env in $PROJECT_DIR: nothing to back up."
    exit 1
fi

print_info "Creating backup: $TIMESTAMP"

# .env and config/ are required; the rest is included when this installation has it.
items=(.env config)
for optional in certificates nginx generated; do
    [ -e "$PROJECT_DIR/$optional" ] && items+=("$optional")
done

BACKUP_FILE="$BACKUP_DIR/trackhub_config_$TIMESTAMP.tar.gz"
tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" "${items[@]}"
print_success "Configuration backup created: $BACKUP_FILE (${items[*]})"

# Documents stored on the local file system live in the manager's volume, not in the database.
DOCUMENT_STORAGE_PROVIDER="$(grep -E '^DOCUMENT_STORAGE_PROVIDER=' "$PROJECT_DIR/.env" | tail -n 1 | cut -d= -f2- | tr -d "\"'" || true)"
if [ "${DOCUMENT_STORAGE_PROVIDER:-LocalFileSystem}" = "LocalFileSystem" ]; then
    DOCUMENTS_FILE="trackhub_documents_$TIMESTAMP.tar.gz"
    docker run --rm --volumes-from trackhub-manager -v "$BACKUP_DIR":/backup alpine \
        tar -czf "/backup/$DOCUMENTS_FILE" -C /app documents
    chmod 600 "$BACKUP_DIR/$DOCUMENTS_FILE"
    print_success "Documents backup created: $BACKUP_DIR/$DOCUMENTS_FILE"
fi

print_info "Recent backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz | tail -5

# Keep the last 10 of each kind.
print_info "Cleaning up old backups (keeping last 10 of each kind)..."
cd "$BACKUP_DIR"
for kind in trackhub_config trackhub_documents; do
    ls -t "$kind"_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm --
done

print_success "Backup complete!"
