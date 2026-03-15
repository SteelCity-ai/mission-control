# Real System Data Design

## Overview
Implement real Tailscale VPN data and OpenClaw Gateway status for the Mission Control System page.

## Background
The System page currently shows basic CPU/RAM/disk via Node.js `os` module. We need to add real Tailscale VPN data and OpenClaw Gateway status to give users accurate network and connectivity information.

## Implementation

### 1. docker-compose.yml Changes
Add the following to enable access to Tailscale socket, Docker socket, and gateway:

```yaml
services:
  mission-control:
    # ... existing config
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      # ... existing volumes
      - /var/run/tailscale:/var/run/tailscale:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      # ... existing env
      - OPENCLAW_GATEWAY_URL=http://host.docker.internal:18789
```

### 2. New API Route: `/api/system/real`

Create `src/app/api/system/real/route.ts` that aggregates real data:

**Tailscale Data:**
- Connect to Unix socket at `/var/run/tailscale/tailscaled.sock`
- Request path: `/localapi/v0/status`
- Use Node.js `http` module with `socketPath` option
- Extract: IP, hostname, online status, peer count
- Graceful nulls if unavailable

**OpenClaw Gateway:**
- HTTP GET to `http://host.docker.internal:18789/health` (or probe port)
- Measure latency
- Return reachable status and latency in ms

**Docker Stats (optional):**
- Use docker.sock to get container stats
- Focus on the mission-control container itself

**Response Format:**
```json
{
  "tailscale": {
    "available": true,
    "ip": "100.x.x.x",
    "hostname": "server-name",
    "online": true,
    "peerCount": 5
  },
  "gateway": {
    "available": true,
    "reachable": true,
    "latencyMs": 12
  },
  "docker": {
    "available": true,
    "containerStats": { ... }
  }
}
```

### 3. Update System Page

Modify `src/app/(dashboard)/system/page.tsx` to:
- Fetch from `/api/system/real` for Tailscale data
- Display real Tailscale IP, hostname, peer count, online status
- Show gateway reachable status and latency
- Keep existing os module data (CPU, RAM, disk) working

### 4. Integration

The existing `/api/system/monitor` already fetches Tailscale via CLI. The new route provides:
- Real-time Tailscale via socket (no CLI dependency)
- Gateway connectivity status
- Container stats from Docker API

## Constraints
- Graceful degradation — if Tailscale socket not mounted, show "not available"
- No external binaries — pure Node.js HTTP/socket calls
- Keep existing os module data working
- Conventional commits for all changes

## Acceptance Criteria
- [ ] docker-compose.yml has correct mounts and env
- [ ] `/api/system/real` returns JSON with all sources
- [ ] Tailscale data shows real IP, hostname, peer count when available
- [ ] Gateway shows reachable status and latency
- [ ] System page displays real data (or graceful nulls)
- [ ] No CLI dependencies for Tailscale
