#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Disable Headroom anonymous telemetry for this session and the proxy/MCP runtime.
export HEADROOM_TELEMETRY=off
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export HEADROOM_TELEMETRY=off' >> "$CLAUDE_ENV_FILE"
fi

# Install Headroom (context compression for AI agents) with MCP server support.
# https://github.com/chopratejas/headroom
pip3 install --quiet --user "headroom-ai[mcp]"

# Register the Headroom MCP server with Claude Code (idempotent).
# Only the "headroom" server is registered here — Serena MCP is intentionally
# not installed (equivalent to --no-serena).
"$HOME/.local/bin/headroom" mcp install --agent claude

# Ensure the registered MCP server runs with telemetry disabled, and confirm
# no Serena server is present in the Claude config.
python3 - <<'PY'
import json, os
cfg_path = os.path.expanduser("~/.claude.json")
try:
    with open(cfg_path) as f:
        cfg = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    cfg = {}
servers = cfg.get("mcpServers", {})
hr = servers.get("headroom")
if hr is not None:
    env = hr.setdefault("env", {})
    env["HEADROOM_TELEMETRY"] = "off"
# Make sure Serena was not registered (honor --no-serena intent).
servers.pop("serena", None)
cfg["mcpServers"] = servers
with open(cfg_path, "w") as f:
    json.dump(cfg, f, indent=2)
PY

# Install JS dependencies as usual
npm install
