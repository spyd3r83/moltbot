#!/usr/bin/env python3
"""Sync Discord channel allowlist in Moltbot config.

Adds missing channels under channels.discord.guilds.<guild_id>.channels
with allow=true and requireMention=false. Does not remove existing entries.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import Any, Dict, Iterable, List

# Load .env if available
def _load_env() -> None:
    """Load environment variables from .env file in moltbot directory."""
    # Try to find .env relative to script location
    script_dir = Path(__file__).parent
    moltbot_dir = script_dir.parent
    env_file = moltbot_dir / ".env"

    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    # Only set if not already in environment
                    if key.strip() not in os.environ:
                        os.environ[key.strip()] = value.strip()

_load_env()

# Use environment variable with fallback to user's home directory
DEFAULT_CONFIG_PATH = os.environ.get(
    "MOLTBOT_CONFIG_PATH",
    str(Path.home() / ".moltbot" / "moltbot.json")
)
DEFAULT_TYPES = {0, 5, 10, 11, 12, 15}


def _load_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_json(path: str, data: Dict[str, Any]) -> None:
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, sort_keys=False)
        handle.write("\n")
    os.replace(tmp_path, path)


def _fetch_guild_channels(token: str, guild_id: str) -> List[Dict[str, Any]]:
    url = f"https://discord.com/api/v10/guilds/{guild_id}/channels"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bot {token}")
    req.add_header("User-Agent", "moltbot-sync/1.0")
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = resp.read().decode("utf-8")
    return json.loads(payload)


def _parse_types(raw: str) -> Iterable[int]:
    for item in raw.split(","):
        item = item.strip()
        if not item:
            continue
        yield int(item)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=DEFAULT_CONFIG_PATH)
    parser.add_argument("--guild-id", required=True)
    parser.add_argument("--token")
    parser.add_argument(
        "--types",
        default=None,
        help="Comma-separated Discord channel type ids to include (default: text/news/forum/thread types)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    config = _load_json(args.config)
    token = args.token
    if not token:
        token = (
            config.get("channels", {})
            .get("discord", {})
            .get("token")
        )
    if not token:
        raise SystemExit("Discord token missing (pass --token or set channels.discord.token)")

    allowed_types = set(DEFAULT_TYPES)
    if args.types:
        allowed_types = set(_parse_types(args.types))

    channels = _fetch_guild_channels(token, args.guild_id)
    matched = [ch for ch in channels if ch.get("type") in allowed_types]

    guilds = config.setdefault("channels", {}).setdefault("discord", {}).setdefault("guilds", {})
    guild = guilds.setdefault(args.guild_id, {})
    existing = guild.setdefault("channels", {})

    added: List[str] = []
    for ch in matched:
        chan_id = str(ch.get("id"))
        if chan_id in existing:
            continue
        existing[chan_id] = {"allow": True, "requireMention": False}
        added.append(chan_id)

    if args.dry_run:
        print(json.dumps({"added": added, "total_found": len(matched)}))
        return 0

    if added:
        _write_json(args.config, config)
        print(json.dumps({"added": added, "total_found": len(matched)}))
    else:
        print(json.dumps({"added": [], "total_found": len(matched)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
