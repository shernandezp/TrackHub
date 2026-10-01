#!/bin/bash
# The .env keys no compose default covers; sourced by deploy.sh and sync-config.sh.

REQUIRED_CONFIG_KEYS=(
    ALLOWED_CORS_ORIGINS
    AUTHORITY_URL
    DB_CONNECTION_SECURITY
    DB_CONNECTION_MANAGER
    DB_CONNECTION_TELEMETRY
    DB_CONNECTION_LOGGING
    CERTIFICATE_PASSWORD
    ENCRYPTION_KEY
    SYNCWORKER_CLIENT_SECRET
    ROUTER_CLIENT_SECRET
    SECURITY_CLIENT_SECRET
    GEOFENCE_CLIENT_SECRET
    TRIP_CLIENT_SECRET
    REPORTING_CLIENT_SECRET
    MANAGER_CLIENT_SECRET
)

config_value() {
    local value
    value="$(grep -E "^$2=" "$1" | tail -n 1 | cut -d= -f2-)"
    value="${value%$'\r'}"
    value="${value#\"}"; value="${value%\"}"
    value="${value#\'}"; value="${value%\'}"
    printf '%s' "$value"
}

# Grepped rather than sourced: values may contain shell metacharacters.
missing_required_config() {
    local env_file="$1" key value
    for key in "${REQUIRED_CONFIG_KEYS[@]}"; do
        value="$(config_value "$env_file" "$key")"
        case "$value" in
            ""|*your-*|*YOUR_*|XXXXXXXX-*|*GENERATE_A_SECURE_SECRET*) echo "$key" ;;
        esac
    done

    if [ -z "$(config_value "$env_file" PORTAL_BASE_URL)" ]; then
        case "$(config_value "$env_file" DOMAIN)" in
            ""|*your-*) echo DOMAIN ;;
        esac
    fi
}
