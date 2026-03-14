# Steel City AI — Agent Control Center: Complete Project Plan

**Classification:** P1 — Internal Tooling  
**Prepared by:** R2 (Foreman)  
**Date:** 2026-03-14  
**Status:** Ready for Execution  
**Prior work:** Phase 1 research + architecture done 2026-03-13 (see research_investigation.md, technical_architecture.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Research Findings](#2-research-findings)
3. [Recommended Architecture](#3-recommended-architecture)
4. [Task Board by Department](#4-task-board-by-department)
5. [Risk Register](#5-risk-register)
6. [Milestone Timeline](#6-milestone-timeline)
7. [Next 48 Hours Action Items](#7-next-48-hours-action-items)

---

## 1. Executive Summary

The Steel City AI Agent Control Center ("Mission Control") is a web dashboard giving Mike full operational visibility over the 11-agent Steel City AI team running on OpenClaw. It is NOT a rebuild of OpenClaw's Control UI — it is a **mission-specific overlay** that aggregates agent state, project tasks, memory, and workflow orchestration into a single steel-themed command center.

**What already exists:**
- Phase 1 research + architecture docs (created 2026-03-13)
- All 11 agent workspaces configured and running
- OpenClaw Gateway running on port 18789 with full WebSocket API
- Native Control UI at `http://127.0.0.1:18789/` (chat, sessions, cron, channels)
- mem0 connected (API key confirmed)
- Tech stack selected: React + Vite + Shadcn/UI + Express + Socket.IO + SQLite

**What needs to be built:** The dashboard application itself (8 weeks, 4 phases).

**Key insight:** OpenClaw's Gateway WebSocket protocol exposes a rich API (`sessions.list`, `system-presence`, `health`, `cron.*`, `config.get`) that we can proxy through our Express backend. We do NOT need agents to push data to us — we pull from the Gateway.

---

## 2. Research Findings

### 2.1 Existing Solutions Assessment

| Solution | What It Is | Can We Use It? | Verdict |
|----------|-----------|----------------|---------|
| **OpenClaw Control UI** | Vite+Lit SPA at :18789/ | Already running | Partial — covers chat, sessions, cron. Missing: project view, team velocity, mem0 viewer, workflow orchestration |
| **LangGraph Studio** | Desktop IDE for LangGraph graphs | No — wrong framework | ❌ Not applicable |
| **CrewAI Studio** | Visual agent crew builder | No — our agents aren't CrewAI | ❌ Not applicable |
| **AutoGen Studio** | Low-code prototyping tool | No — research prototype, not production | ❌ Not applicable |
| **OpenClaw's own WS API** | `sessions.list`, `health`, `presence`, `cron.*`, `config.get` | ✅ Yes | **Primary data source** |

**Conclusion:** No off-the-shelf solution fits. Build custom, but leverage OpenClaw's Gateway API heavily.

### 2.2 OpenClaw Gateway API Capabilities (Confirmed)

The Gateway WebSocket at `ws://127.0.0.1:18789` exposes (requires auth token):

```
connect → hello-ok (snapshot: presence, health, stateVersion, uptimeMs)

RPC Methods Available:
  chat.history        - Message history per agent/channel
  chat.send           - Send messages to agents
  sessions.list       - All agent sessions + status
  sessions.patch      - Modify session (thinking, fast, verbose)
  system-presence     - Active connections (deviceId, roles, scopes)
  health              - Full health snapshot (channels, uptime, sessions)
  models.list         - Available models
  cron.*              - List/add/edit/run/enable/disable cron jobs
  skills.*            - Status, enable/disable, install
  node.list           - Connected nodes
  config.get          - Read openclaw.json
  config.set          - Write config (use carefully)
  config.apply        - Apply + restart
  logs.tail           - Live log streaming
  exec.approvals.*    - Approval lists

Events (Server → Client):
  agent              - Tool calls, streaming output
  chat               - New messages
  presence           - Connection changes
  tick               - Heartbeat (every 15s)
  health             - Health update
  heartbeat          - Agent heartbeat
  shutdown           - Gateway stopping
```

**HTTP REST also available:**
- `POST /v1/responses` — OpenAI-compatible (disabled by default, can enable)
- `GET /` — Control UI (currently running)

### 2.3 Data Sources Map

| Data Needed | Source | Method | Freshness |
|-------------|--------|---------|-----------|
| Agent online/offline | Gateway `system-presence` event | WS push | Real-time |
| Agent model assignments | `openclaw.json` via `config.get` | WS pull | On demand |
| Session health | Gateway `health` RPC | WS poll (30s) | Near real-time |
| Active agent sessions | `sessions.list` | WS poll (5s) | Near real-time |
| Live agent activity (tool calls) | `agent` events | WS subscribe | Real-time |
| Message history | `chat.history` | WS pull | On demand |
| Cron jobs | `cron.*` | WS pull | On demand |
| Log streaming | `logs.tail` | WS subscribe | Real-time |
| mem0 memories (all agents) | mem0 REST API (`/v1/memories/`) | REST poll | On demand |
| Project tasks | Workspace markdown files | FS read | On change |
| Agent workspace files | FS mounted volume | FS read | On demand |

### 2.4 mem0 Per-Agent Partitioning

mem0 supports `user_id`, `agent_id`, `app_id`, `run_id` scoping. Current setup uses `user_id=mike` for everything. To implement the Memory Viewer panel:

1. Adopt `agent_id` field going forward (R2=foreman, 3CP0=research, etc.)
2. Migrate existing 107 memories by tagging with `agent_id` where determinable
3. Dashboard queries `GET /v1/memories/?agent_id={agentId}` per agent

### 2.5 Real-Time Patterns

**Decision (confirmed from prior research):**
- **WebSocket** (Socket.IO) → agent activity, session status, live logs
- **SSE** (EventSource) → log streaming fallback
- **REST polling** → mem0, project files (5-10s interval acceptable)

OpenClaw Gateway WS events fire on the Gateway's tick (15s default) for heartbeat, real-time for agent/chat events. Our Express backend acts as a WS proxy + data aggregator.

---

## 3. Recommended Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MISSION CONTROL UI (Browser)                    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│   │Projects  │ │ Agents   │ │Department│ │ Workflow │ │ Memory │  │
│   │Overview  │ │ Status   │ │  Tasks   │ │ Launcher │ │ Viewer │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│                    React 18 + Vite + TypeScript                     │
│                    Shadcn/UI + Zustand + Socket.IO client           │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTPS / WSS (port 3001)
┌─────────────────────────▼───────────────────────────────────────────┐
│                   MISSION CONTROL API (Express.js)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Auth JWT   │  │  WS Proxy  │  │  REST API  │  │  File Server │  │
│  │ Middleware │  │  (Gateway) │  │  Endpoints │  │  (workspace) │  │
│  └────────────┘  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  │
│  ┌────────────┐         │               │                │          │
│  │  SQLite    │  ┌──────▼──────┐  ┌────▼────┐   ┌───────▼──────┐  │
│  │  Activity  │  │  Socket.IO  │  │  mem0   │   │  Workspace   │  │
│  │  History   │  │  Hub        │  │  Client │   │  FS (read)   │  │
│  └────────────┘  └─────────────┘  └─────────┘   └──────────────┘  │
└─────────┬───────────────┬─────────────────────────────────────────┘
          │               │
          ▼               ▼
┌──────────────┐  ┌──────────────────────────────────────────────────┐
│  mem0 Cloud  │  │         OpenClaw Gateway (ws://127.0.0.1:18789)  │
│  REST API    │  │  sessions.list │ health │ agent events │ logs     │
└──────────────┘  └──────────────────────────────────────────────────┘
```

### 3.2 Tech Stack (Final)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend framework | React 18 + Vite + TypeScript | Fast, modern, team familiarity |
| UI components | Shadcn/UI + Tailwind CSS | Steel-themed dark UI, accessible |
| State management | Zustand | Lightweight, TS-friendly |
| Charts/metrics | Recharts | Task velocity, token burn |
| Real-time client | Socket.IO client | Auto-reconnect, fallback |
| Backend | Express.js + TypeScript | Stable, Luke knows it |
| WebSocket server | Socket.IO | Bridges Gateway WS → UI WS |
| Database | SQLite (better-sqlite3) | Simple, no infra needed |
| Auth | JWT + HttpOnly cookies | Single-user, Mike only |
| Deployment | Docker (single container) | Same server as Gateway |
| Reverse proxy | Already configured | Port 3001 → /mission-control |

### 3.3 UI Panels (7 Required)

```
MISSION CONTROL — STEEL CITY AI
═══════════════════════════════════════════════════════════════

┌─ SIDEBAR ────────┐  ┌─ MAIN CONTENT AREA ──────────────────┐
│ 🏭 Steel City AI  │  │                                      │
│                  │  │  [Panel content based on selection]   │
│ ● Projects       │  │                                      │
│ ● Team Status    │  │                                      │
│ ● Departments    │  │                                      │
│ ● Live Activity  │  │                                      │
│ ● Orchestration  │  │                                      │
│ ● Memory Viewer  │  │                                      │
│ ● Logs           │  │                                      │
│                  │  │                                      │
│ ──────────────── │  │                                      │
│ Agent Quick View │  │                                      │
│ ● Yoda  🟢 LIVE  │  │                                      │
│ ● R2    🟢 LIVE  │  │                                      │
│ ● 3CP0  ⚫ IDLE  │  │                                      │
│ ● Akbar ⚫ IDLE  │  │                                      │
│ ● Luke  ⚫ IDLE  │  │                                      │
│ ● Leia  ⚫ IDLE  │  │                                      │
│ ● Han   ⚫ IDLE  │  │                                      │
│ ● Lando ⚫ IDLE  │  │                                      │
│ ● Chewy ⚫ IDLE  │  │                                      │
│ ● OBWON ⚫ IDLE  │  │                                      │
│ ● MacG  ⚫ IDLE  │  │                                      │
└──────────────────┘  └──────────────────────────────────────┘
```

**Panel Specs:**

| Panel | Data Source | Refresh |
|-------|------------|---------|
| Projects Overview | Workspace markdown files (`projects/*/`) | On load + file watch |
| Team Status | Gateway `sessions.list` + `health` | 5s poll |
| Department Tasks | Workspace task board markdown files | On load |
| Live Activity | Gateway `agent` WS events | Real-time |
| Workflow Launcher | Gateway `chat.send` + cron API | On demand |
| Memory Viewer | mem0 REST API `/v1/memories/` | On demand |
| Logs | Gateway `logs.tail` WS stream | Real-time |

### 3.4 Deployment

```
Hostinger VPS (Docker)
├── openclaw-cnvy container (port 18789) — EXISTING, no changes
└── mission-control container (port 3001) — NEW
    └── Reverse proxy: /mission-control → :3001
```

**Docker Compose addition:**
```yaml
mission-control:
  build: ./mission-control
  ports:
    - "127.0.0.1:3001:3001"
  environment:
    - OPENCLAW_GATEWAY_URL=ws://openclaw-cnvy:18789
    - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
    - MEM0_API_KEY=${MEM0_API_KEY}
    - WORKSPACE_PATH=/data/.openclaw/workspace
  volumes:
    - openclaw-data:/data:ro
  networks:
    - openclaw-net
```

---

## 4. Task Board by Department

### Task ID Convention: `SC-MCC-[DEPT]-[SEQ]`

---

### 🔬 RESEARCH (3CP0) — 2 tasks

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC-R-01 | Audit 107 mem0 memories and create agent_id tagging scheme | 4h | High | Spreadsheet showing which memories belong to which agent; migration script ready |
| SC-MCC-R-02 | Document OpenClaw Gateway WS API methods and event shapes in dashboard-consumable format | 3h | High | `docs/gateway-api-reference.md` with TypeScript types for all events we'll consume |

**Total Research effort:** 7h

---

### 🏗️ ARCHITECTURE (Akbar) — 3 tasks

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC-A-01 | Design Express API contract for all `/api/*` endpoints + WS event schema | 4h | High | OpenAPI YAML spec or TS interface file committed to repo |
| SC-MCC-A-02 | Design SQLite schema for activity history, session snapshots, event log | 2h | High | `schema.sql` with indexes, migration strategy |
| SC-MCC-A-03 | Define Docker Compose additions for mission-control service | 2h | Medium | `docker-compose.mission-control.yml` with correct networking, volumes, env vars |

**Total Architecture effort:** 8h

---

### 🔨 BUILD (Luke) — 22 tasks across 4 phases

#### Phase 1: Foundation (Week 1-2)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC-B-01 | Initialize monorepo: React+Vite frontend + Express backend, TypeScript config, ESLint/Prettier | 3h | — | `npm run dev` starts both; `npm run build` produces artifacts |
| SC-MCC-B-02 | Set up Shadcn/UI with steel-dark theme (charcoal, steel blue, amber accents) | 2h | B-01 | Theme tokens defined, demo button/card renders correctly |
| SC-MCC-B-03 | Build sidebar navigation + header shell + responsive layout | 3h | B-02 | All 7 nav items render, mobile collapses to hamburger |
| SC-MCC-B-04 | Set up Express server + JWT auth middleware + `/api/health` | 2h | B-01 | Health endpoint returns 200; unauthenticated requests get 401 |
| SC-MCC-B-05 | OpenClaw Gateway WS client (Node.js) — connect, auth, reconnect logic | 4h | B-04 | Client connects to gateway, logs `hello-ok`, auto-reconnects on drop |
| SC-MCC-B-06 | Socket.IO hub — bridge Gateway WS events to UI clients | 3h | B-05 | Gateway events forwarded to connected browser clients with <100ms latency |
| SC-MCC-B-07 | SQLite setup (better-sqlite3) + schema migration runner | 2h | B-04 | DB created on first run, schema applied, test insert/query works |
| SC-MCC-B-08 | GitHub repo setup + Docker multi-stage build + CI (GitHub Actions) | 2h | B-01 | PR builds pass; Docker image builds successfully |

**Phase 1 total:** 21h

#### Phase 2: Core Panels (Week 3-4)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC-B-09 | Agent Status panel — sidebar + Team Status page showing 11 agents with online/idle/offline, model, last active | 4h | B-06 | Status updates within 5s of gateway presence event; shows model name |
| SC-MCC-B-10 | Live Activity feed — real-time agent event stream (tool calls, completions, errors) | 4h | B-06 | Events appear within 1s of gateway `agent` event; filterable by agent |
| SC-MCC-B-11 | Projects Overview panel — reads workspace `projects/*/` directories for active projects | 3h | B-04 | Lists all project folders, shows README title + last modified; auto-refreshes |
| SC-MCC-B-12 | Department Tasks panel — reads task board markdown files per department | 3h | B-04 | Shows task counts (todo/in-progress/done) per department; links to source file |
| SC-MCC-B-13 | API: `GET /api/agents` — sessions + presence aggregated | 2h | B-05, A-01 | Returns typed JSON for all 11 agents; < 200ms |
| SC-MCC-B-14 | API: `GET /api/projects` + `GET /api/tasks` — workspace FS reader | 2h | A-01 | Reads project dirs and task boards; handles missing/empty gracefully |

**Phase 2 total:** 18h

#### Phase 3: Advanced Features (Week 5-6)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC-B-15 | Workflow Launcher — UI form to spawn a new subagent task (agent selector + task input + model override) | 5h | B-06 | Can select agent, type task, click "Launch" → sends via `chat.send` to Gateway → confirms dispatch |
| SC-MCC-B-16 | Memory Viewer — per-agent mem0 memory browser with search | 4h | R-01 | Shows memories per agent, full-text search, 50-memory pagination |
| SC-MCC-B-17 | Live Logs panel — tail Gateway logs with filter/search | 3h | B-06 | Streams last 200 log lines, searchable, auto-scrolls |
| SC-MCC-B-18 | API: `POST /api/spawn` — relay to Gateway `chat.send` with safety guard | 2h | B-05, A-01 | Validates payload, logs to SQLite activity_log, returns dispatch confirmation |
| SC-MCC-B-19 | API: `GET /api/memory` + `GET /api/memory/:agentId` — mem0 proxy | 2h | R-01 | Returns typed memories; handles mem0 API errors gracefully |
| SC-MCC-B-20 | Activity history persistence — save Gateway agent events to SQLite | 2h | B-07, B-06 | Events saved on receipt; 30-day retention; query API `GET /api/activity?agent=&limit=` |

**Phase 3 total:** 18h

#### Phase 4: Polish & Deploy (Week 7-8)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC-B-21 | Performance — react-window virtualization for activity + log lists, code splitting | 3h | All UI | No jank on 1000+ event list; Lighthouse score ≥ 80 |
| SC-MCC-B-22 | Docker deployment — `docker-compose.mission-control.yml`, env vars, volume mounts, health check | 3h | A-03 | `docker compose up` starts container; health endpoint reachable from host |

**Phase 4 total:** 6h

**Total Build effort:** 63h

---

### 🎨 DESIGN (Leia) — 4 tasks

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC-D-01 | Steel-dark theme spec: color tokens, typography, spacing, icon set | 4h | High | Figma file or `theme.css` with named tokens; 4.5:1 contrast on all text |
| SC-MCC-D-02 | High-fidelity mockups for all 7 panels (desktop 1440px + tablet 768px) | 8h | High | Figma frames for each panel; Mike approves before Build starts Phase 2 |
| SC-MCC-D-03 | Agent status card component spec (online indicator, model badge, activity timeline) | 2h | Medium | Component spec doc with dimensions, states (active/idle/offline/error) |
| SC-MCC-D-04 | Workflow launcher UX flow + empty states + error states | 3h | Medium | Figma flow from "click Launch" to "confirmed dispatch"; all error states covered |

**Total Design effort:** 17h

---

### ✅ QA (Han) — 5 tasks

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC-Q-01 | Test plan: unit tests (Vitest) + integration tests + E2E (Playwright) | 2h | High | Test plan doc; test runner configured in CI |
| SC-MCC-Q-02 | Security audit: path traversal in file API, JWT validation, CORS, rate limiting | 3h | High | No path traversal vulnerabilities; CORS locked to Mike's IP; rate limits on `/api/spawn` |
| SC-MCC-Q-03 | Performance testing: 1000 events/min load simulation | 2h | Medium | Dashboard stable under load; no memory leaks after 1h run |
| SC-MCC-Q-04 | Cross-browser testing: Chrome, Firefox, Safari (iOS) | 2h | Medium | All panels render correctly in all three; no layout breaks |
| SC-MCC-Q-05 | Regression suite — automated tests for agent status, project list, workflow launch | 3h | High | CI runs tests on every PR; 0 failures on merge |

**Total QA effort:** 12h

---

### 📣 GROWTH (Lando) — 1 task

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC-G-01 | Internal launch doc: "Mission Control User Guide" for Mike (how to use each panel, keyboard shortcuts, tips) | 3h | Low | Markdown doc in `docs/user-guide.md`; covers all 7 panels |

**Total Growth effort:** 3h

---

### 📊 REPORTING (Chewy) — 2 tasks

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC-REP-01 | Weekly build status report template for Mission Control project | 1h | Low | Template markdown with: completed tasks, blockers, next week plan |
| SC-MCC-REP-02 | Project completion report: final metrics (build time, test coverage, performance scores) | 2h | Low | Delivered when Phase 4 completes |

**Total Reporting effort:** 3h

---

### 🗂️ PM-SYNC (OBWON) — 2 tasks

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC-PM-01 | Create all SC-MCC-* tasks in project tracking tool (Linear/Jira/Asana) with correct department labels | 2h | High | All tasks visible in PM tool; assigned to correct agent |
| SC-MCC-PM-02 | Set up weekly velocity tracking — tasks completed per week per department | 1h | Medium | Velocity chart in PM tool; R2 can query status weekly |

**Total PM effort:** 3h

---

### Task Summary

| Department | Agent | Tasks | Total Hours |
|------------|-------|-------|-------------|
| Research | 3CP0 | 2 | 7h |
| Architecture | Akbar | 3 | 8h |
| Build | Luke | 22 | 63h |
| Design | Leia | 4 | 17h |
| QA | Han | 5 | 12h |
| Growth | Lando | 1 | 3h |
| Reporting | Chewy | 2 | 3h |
| PM-Sync | OBWON | 2 | 3h |
| **TOTAL** | | **41 tasks** | **116h** |

---

## 5. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-01 | OpenClaw Gateway auth token rotates or changes | Medium | High | Store token in Docker secrets; dashboard auto-reconnects with stored token |
| R-02 | Gateway WS protocol changes on OpenClaw update | Low | High | Pin OpenClaw version; version-check on connect handshake |
| R-03 | mem0 API rate limits (free tier) | Medium | Medium | Cache responses in SQLite for 60s; add mem0 to Paid plan if needed |
| R-04 | Dashboard port 3001 conflicts with another service | Low | Medium | Use Akbar's Docker Compose spec with explicit port mapping; test pre-deploy |
| R-05 | File system path traversal vulnerability in file API | Medium | High | Han to audit explicitly (SC-MCC-Q-02); use allowlist of allowed base paths |
| R-06 | Grok 4.20 provider failures (R2's own model) | Medium | Medium | R2 currently running on Sonnet 4.6 fallback; Gateway error surfaced in dashboard |
| R-07 | mem0 per-agent partitioning migration corrupts existing memories | Low | High | 3CP0 creates tagging plan before any migration; dry-run first |
| R-08 | Mike can't access dashboard remotely (Gateway on loopback) | High | High | Expose via Tailscale Serve (same pattern as Gateway); Akbar to spec this in A-03 |
| R-09 | Build scope creep (adding features mid-stream) | High | Medium | P2 features tracked in backlog; no mid-phase additions without R2 approval |
| R-10 | Single-agent bottleneck on Luke for all build tasks | Medium | Medium | Phase 2 tasks B-09 through B-14 can be parallelized if Luke spawns sub-agents |

---

## 6. Milestone Timeline

```
Week 1-2   FOUNDATION
           ├── [R2 + 3CP0] SC-MCC-R-01, R-02 (mem0 audit + Gateway API docs)
           ├── [R2 + Akbar] SC-MCC-A-01, A-02, A-03 (API contract, DB schema, Docker spec)
           ├── [Leia] SC-MCC-D-01 (theme spec)
           ├── [OBWON] SC-MCC-PM-01 (tasks in PM tool)
           └── [Luke] SC-MCC-B-01 through B-08 (project setup, gateway WS client, SQLite)
           🏁 MILESTONE 1: Running empty shell + Gateway WS connected

Week 3-4   CORE PANELS
           ├── [Leia] SC-MCC-D-02, D-03 (mockups + agent card spec) ← Mike reviews
           ├── [Luke] SC-MCC-B-09 through B-14 (agent status, live activity, projects, tasks)
           └── [Han] SC-MCC-Q-01 (test plan + CI config)
           🏁 MILESTONE 2: Dashboard shows live agent status, projects, and activity

Week 5-6   ADVANCED FEATURES
           ├── [3CP0] SC-MCC-R-01 execution (mem0 migration tagging)
           ├── [Leia] SC-MCC-D-04 (workflow launcher UX)
           ├── [Luke] SC-MCC-B-15 through B-20 (workflow launcher, memory viewer, logs, persistence)
           └── [Han] SC-MCC-Q-02, Q-03 (security audit, load testing)
           🏁 MILESTONE 3: Full feature set — workflow launch + memory viewer working

Week 7-8   POLISH & DEPLOY
           ├── [Luke] SC-MCC-B-21, B-22 (performance + Docker deploy)
           ├── [Han] SC-MCC-Q-04, Q-05 (cross-browser + regression suite)
           ├── [Lando] SC-MCC-G-01 (user guide)
           └── [Chewy] SC-MCC-REP-02 (completion report)
           🏁 MILESTONE 4: Production deployed at https://steelcity.ai/mission-control

TOTAL TIMELINE: 8 weeks
PARALLEL CAPACITY: Research + Architecture + Design can all run Week 1-2 in parallel
```

---

## 7. Next 48 Hours Action Items

**Priority order — R2 will spawn these in sequence:**

### Hour 0-4: Kick Off (Today, R2 orchestrates)

| Action | Who | Task | Time |
|--------|-----|------|------|
| ✅ This plan | R2 | Complete project plan delivered | Done |
| 🚀 Spawn 3CP0 | R2 → 3CP0 | SC-MCC-R-02: Document Gateway WS API methods in TypeScript types | Today |
| 🚀 Spawn Akbar | R2 → Akbar | SC-MCC-A-01 + A-02: API contract + DB schema | Today |
| 🚀 Spawn OBWON | R2 → OBWON | SC-MCC-PM-01: Create all tasks in PM tool | Today |

### Hour 4-24: Foundation (Luke starts building)

| Action | Who | Task | Time |
|--------|-----|------|------|
| 🚀 Spawn Luke | R2 → Luke | SC-MCC-B-01 + B-02: Initialize monorepo + Shadcn theme | After Akbar delivers A-01 |
| 🚀 Spawn Leia | R2 → Leia | SC-MCC-D-01: Steel dark theme spec | Parallel with Luke |
| Mike reviews | Mike | Approve theme direction and mockup direction | After D-01 |

### Hour 24-48: Gateway Integration

| Action | Who | Task | Time |
|--------|-----|------|------|
| Luke | Luke | SC-MCC-B-03 through B-07: Shell + auth + Gateway WS client | After B-01/B-02 |
| 3CP0 | 3CP0 | SC-MCC-R-01: mem0 memory audit (run in background) | Day 2 |
| R2 | R2 | Deploy interim stub to VPS for Mike to see the shell | End of 48h |

### Mike's Decision Points (Before Week 3)

1. **Approve theme/mockups** (Leia D-02) before Luke starts Phase 2 UI
2. **Confirm PM tool** — Linear, Jira, or Asana? (Affects OBWON tasks)
3. **Tailscale access** — Is Tailscale Serve configured on VPS? (Affects remote access plan)
4. **mem0 plan** — Upgrade to paid plan for higher limits? (Affects Memory Viewer design)

---

## Appendix: File Locations

```
Project files:
/data/.openclaw/workspace/projects/mission-control-dashboard/
  PROJECT_PLAN_v2.md          ← This file
  research_investigation.md   ← Prior research (2026-03-13)
  technical_architecture.md   ← Prior architecture (2026-03-13)
  implementation_plan.md      ← Prior phased plan (2026-03-13)

Workspace config:
/data/.openclaw/openclaw.json           ← 11 agent configs, Gateway port 18789
/data/.openclaw/workspace-{agent}/      ← Per-agent workspaces (all confirmed)

Gateway:
ws://127.0.0.1:18789                    ← Running, auth token configured
http://127.0.0.1:18789/                 ← Native Control UI (currently accessible)

mem0:
API key: ~/.config/mem0/api_key
Current memories: 107 (all user_id=mike, need agent_id partitioning)
```
