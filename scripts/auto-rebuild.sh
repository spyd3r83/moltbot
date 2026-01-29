#!/bin/bash
# Auto-rebuild script for moltbot
# Triggered by systemd path unit when .git/FETCH_HEAD or .git/HEAD changes

set -e

# Derive moltbot directory from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOLTBOT_DIR="${MOLTBOT_DIR:-$(dirname "$SCRIPT_DIR")}"

# Load environment variables from .env if it exists
if [ -f "$MOLTBOT_DIR/.env" ]; then
    set -a  # Automatically export all variables
    source "$MOLTBOT_DIR/.env"
    set +a  # Disable auto-export
fi

# Configuration with defaults (can be overridden in .env)
LOG_FILE="${LOG_FILE:-$HOME/.moltbot/logs/auto-rebuild.log}"
LOCK_FILE="${LOCK_FILE:-$HOME/.moltbot/auto-rebuild.lock}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Check if already running
if [ -f "$LOCK_FILE" ]; then
    log "Auto-rebuild already in progress (lock file exists), skipping"
    exit 0
fi

# Create lock file
touch "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

log "=========================================="
log "Auto-rebuild triggered"
log "=========================================="
log "Moltbot directory: $MOLTBOT_DIR"
log "Log file: $LOG_FILE"

cd "$MOLTBOT_DIR"

# Get current HEAD hash
CURRENT_HEAD=$(git rev-parse HEAD)
log "Current HEAD: $CURRENT_HEAD"

# Check if we're actually on a new commit (avoid rebuilding unnecessarily)
if [ -f "/home/jfi/.moltbot/last-build-commit" ]; then
    LAST_BUILD=$(cat /home/jfi/.moltbot/last-build-commit)
    if [ "$CURRENT_HEAD" = "$LAST_BUILD" ]; then
        log "Already built at this commit, skipping rebuild"
        exit 0
    fi
fi

log "Starting rebuild process..."

# Stop the service
log "Stopping moltbot-gateway.service..."
systemctl --user stop moltbot-gateway.service

# Clean and rebuild
log "Cleaning build artifacts..."
rm -rf dist/ node_modules/

log "Installing dependencies..."
pnpm install >> "$LOG_FILE" 2>&1

log "Building UI..."
pnpm ui:build >> "$LOG_FILE" 2>&1

log "Building application..."
pnpm build >> "$LOG_FILE" 2>&1

# Save current commit
echo "$CURRENT_HEAD" > /home/jfi/.moltbot/last-build-commit

# Restart the service
log "Restarting moltbot-gateway.service..."
systemctl --user start moltbot-gateway.service

# Wait a moment and check status
sleep 3
if systemctl --user is-active --quiet moltbot-gateway.service; then
    log "Service restarted successfully"
    log "Rebuild complete at commit: $CURRENT_HEAD"
else
    log "ERROR: Service failed to start after rebuild"
    systemctl --user status moltbot-gateway.service --no-pager >> "$LOG_FILE" 2>&1
    exit 1
fi

log "=========================================="
log "Auto-rebuild finished successfully"
log "=========================================="
