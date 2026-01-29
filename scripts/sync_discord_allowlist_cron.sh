#!/usr/bin/env bash
set -euo pipefail

# Derive script directory and load .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOLTBOT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if it exists
if [ -f "$MOLTBOT_DIR/.env" ]; then
    set -a
    source "$MOLTBOT_DIR/.env"
    set +a
fi

# Use environment variables with defaults
SCRIPT="${DISCORD_SYNC_SCRIPT:-$SCRIPT_DIR/sync_discord_allowlist.py}"
GUILD_ID="${DISCORD_GUILD_ID:-1396724253621223584}"

output=$($SCRIPT --guild-id "$GUILD_ID")
if [ -z "$output" ]; then
  echo "sync_discord_allowlist: empty output" >&2
  exit 1
fi
added=$(python3 - <<'PY'
import json,sys
raw=sys.stdin.read().strip()
if not raw:
    print(0)
    raise SystemExit(0)
payload=json.loads(raw)
print(len(payload.get("added", [])))
PY
<<< "$output")

echo "$output"
if [ "$added" -gt 0 ]; then
  moltbot gateway restart >/dev/null 2>&1 || true
fi
