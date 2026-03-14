# Steel City AI — Mission Control Dashboard: Project Plan v3 (tenacitOS Foundation)

**Classification:** P1 — Internal Tooling  
**Prepared by:** R2 (Foreman)  
**Date:** 2026-03-14  
**Status:** APPROVED — Executing with tenacitOS baseline  
**Supersedes:** PROJECT_PLAN_v2.md (scratch-build approach)  
**Prior evaluation:** TENACITOS_EVALUATION.md (by MacGyver, 2026-03-14)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What We're Keeping from tenacitOS (Don't Touch)](#2-what-were-keeping)
3. [What We're Adding (Steel City Custom)](#3-what-were-adding)
4. [Codebase Orientation](#4-codebase-orientation)
5. [Task Board by Department](#5-task-board-by-department)
6. [Risk Register](#6-risk-register)
7. [Milestone Timeline (Revised)](#7-milestone-timeline-revised)
8. [Next 48 Hours](#8-next-48-hours)
9. [Open Decisions for Mike](#9-open-decisions-for-mike)

---

## 1. Executive Summary

**The pivot:** Instead of building from scratch (v2 plan: 8 weeks / 116h), we fork and extend tenacitOS — a production-ready Next.js 16 dashboard that already provides ~70% of what we need. This cuts the timeline to **3 weeks / ~55 hours** of net new work.

**What changed:**
- ✅ Drop the entire Express backend build (tenacitOS already has a Next.js API layer)
- ✅ Drop the Socket.IO hub, SQLite setup, and auth system (all exists)
- ✅ Drop the project skeleton, CI, Docker multi-stage build (tenacitOS has it)
- ✅ Drop the React Vite frontend, Shadcn setup, sidebar/navigation (all exists)
- 🔨 Focus exclusively on 8 Steel City-specific additions

**Effort delta vs v2:**
| Work Category | v2 Estimate | v3 Estimate | Savings |
|--------------|-------------|-------------|---------|
| Foundation/scaffold | 21h | 0h | 21h ✅ |
| Auth, DB, WS infra | 11h | 0h | 11h ✅ |
| Core panels (agents, activity) | 18h | 8h | 10h ✅ |
| Advanced features | 18h | 20h | -2h (new scope) |
| Branding/Design | 17h | 8h | 9h ✅ |
| QA | 12h | 8h | 4h ✅ |
| Deploy | 3h | 2h | 1h ✅ |
| **TOTAL** | **116h** | **~55h** | **~61h saved** |

**Timeline: 8 weeks → ~3 weeks.**

---

## 2. What We're Keeping (Don't Touch)

These features are production-ready in tenacitOS. Do NOT rebuild or significantly refactor them:

| Feature | tenacitOS Location | Notes |
|---------|-------------------|-------|
| Agent dashboard (sessions, tokens, status) | `/agents`, `/sessions` | Reads openclaw.json + sessions CLI |
| System monitor (CPU, RAM, Disk, Network) | `/system` | `api/system/monitor` |
| Cost tracking (SQLite) | `/costs`, `/analytics` | `lib/usage-collector.ts` |
| Cron manager + weekly timeline | `/cron` | Includes run now, history, CRUD |
| Memory/file browser + search | `/memory`, `/files`, `/search` | Full FS browser + markdown editor |
| Activity feed + heatmap | `/activity` | `api/activities/stream` SSE |
| Auth (password + rate limit) | `middleware.ts` | JWT cookie, 5-fail lockout |
| Notifications system | `NotificationDropdown` | Bell icon, polling, mark-read |
| Office 3D (React Three Fiber) | `/office` | `agentsConfig.ts` (we'll update this) |
| Sidebar navigation, TopBar, Dock | `components/TenacitOS/` | Extend, don't replace |
| Git viewer | `/git` | Already exists |
| Skills manager | `/skills` | Already exists |
| Terminal (read-only) | `/terminal` | Already exists |

**Key file to understand first:** `src/lib/paths.ts` — controls where tenacitOS looks for OpenClaw data. Our Docker env vars will set `OPENCLAW_DIR=/data/.openclaw`.

---

## 3. What We're Adding (Steel City Custom)

Eight features that don't exist in tenacitOS:

| # | Feature | Effort | Department |
|---|---------|--------|------------|
| 1 | Steel City Branding (theme + config) | 4h | Design + Build |
| 2 | Agent Roster Config (our 11 agents) | 2h | Build |
| 3 | Department Tasks Panel | 10h | Build + Design |
| 4 | Project Overview Panel | 6h | Build |
| 5 | Real-time Agent Activity (live tool calls) | 8h | Build |
| 6 | Workflow Orchestration (kick off + route) | 8h | Build + Design |
| 7 | mem0 Integration (replace file-based memory) | 8h | Build |
| 8 | PM Tool Integration hook (OBWON's domain) | 4h | Build + PM |

**Total net new:** ~50h of feature work + 5h QA/deploy = **~55h**

---

## 4. Codebase Orientation

Key files Luke needs to know before touching anything:

```
tenacitOS/
├── src/
│   ├── config/
│   │   └── branding.ts              ← Steel City config goes here (+ .env.local)
│   ├── components/
│   │   ├── Office3D/
│   │   │   └── agentsConfig.ts      ← Add our 11 agents here
│   │   ├── Sidebar.tsx              ← Add new nav items here
│   │   └── TenacitOS/
│   │       └── Dock.tsx             ← Also add nav items here
│   ├── app/
│   │   ├── (dashboard)/             ← All page routes go here
│   │   │   ├── page.tsx             ← Home dashboard (customize)
│   │   │   ├── agents/page.tsx      ← Exists — enhance with department grouping
│   │   │   ├── workflows/page.tsx   ← Exists — replace static data with SC workflows
│   │   │   └── memory/page.tsx      ← Exists — extend with mem0 API
│   │   └── api/
│   │       ├── agents/route.ts      ← Reads openclaw.json; extend for departments
│   │       ├── activities/          ← SSE stream exists; extend for live tool calls
│   │       └── memory/search/       ← File-based; replace with mem0 API
│   └── lib/
│       ├── paths.ts                 ← Set OPENCLAW_DIR=/data/.openclaw in env
│       └── usage-collector.ts       ← SQLite cost tracking (leave alone)
├── .env.example                     ← Template; create .env.local from this
└── ROADMAP.md                       ← Carlos's original roadmap (reference only)
```

**Path fix needed first:** tenacitOS defaults to `/root/.openclaw`. Our path is `/data/.openclaw`. Set in `.env.local`:
```
OPENCLAW_DIR=/data/.openclaw
OPENCLAW_WORKSPACE=/data/.openclaw/workspace
```

---

## 5. Task Board by Department

### Task ID Convention: `SC-MCC3-[DEPT]-[SEQ]`
*(v3 tasks use MCC3 prefix to distinguish from v2 MCC tasks)*

---

### ⚙️ SETUP — tenacitOS Configuration (Luke, Day 1)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC3-S-01 | Fork tenacitOS repo, create `steel-city` branch, set up `.env.local` with correct paths, admin password, auth secret | 1h | — | `npm run dev` works; login works; agents page shows our 11 agents |
| SC-MCC3-S-02 | Verify all existing tenacitOS features work against our `/data/.openclaw` data structure (agents, costs, cron, sessions, files) | 1h | S-01 | Smoke test checklist passes: agents list, costs chart, cron list, memory browser all populated |
| SC-MCC3-S-03 | Create `docker-compose.mission-control.yml` with correct volume mounts (`/data/.openclaw` read-only), env vars, port 3456, healthcheck | 1h | S-01 | Container starts cleanly; accessible at port 3456 from host |

**Setup total:** 3h

---

### 🎨 DESIGN (Leia) — Branding & UX

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC3-D-01 | Steel City AI branding spec: color tokens (steel-dark bg, Pittsburgh gold #FFB612, steel blue #4A90D9, error red), typography, logo | 3h | High | `theme-spec.md` with hex values, font choices, spacing. Mike approves before D-02. |
| SC-MCC3-D-02 | UX flow for Department Tasks panel (kanban-style columns per department, task card anatomy) | 2h | High | Wireframe or annotated sketch; covers task card states (todo/in-progress/blocked/done) |
| SC-MCC3-D-03 | UX flow for Workflow Orchestration panel (agent selector, task input, dispatch confirmation) | 2h | Medium | Wireframe covering happy path + error state |
| SC-MCC3-D-04 | 3D Office agent desk layout for 11 agents (position grid, department zones, color assignments) | 1h | Low | Updated `agentsConfig.ts` values with correct positions and colors per department |

**Design total:** 8h

---

### 🔨 BUILD (Luke) — Custom Feature Development

#### Sprint 1: Environment + Branding (Days 1-2)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC3-B-01 | Apply Steel City branding: update `branding.ts` + `.env.local` vars (app title, company name, emoji, avatar) | 1h | D-01, S-01 | App shows "Steel City AI" in header/tab/office; Pittsburgh-black background; logo renders |
| SC-MCC3-B-02 | Tailwind theme override: steel-dark palette (charcoal `#1A1C20` bg, Pittsburgh gold `#FFB612` accent, steel blue `#4A90D9`) applied globally via CSS custom properties | 3h | D-01 | Home dashboard renders with Steel City colors; existing components inherit theme; contrast ≥ 4.5:1 |
| SC-MCC3-B-03 | Agent Roster Config: update `agentsConfig.ts` with all 11 Steel City agents (id, name, emoji, position, color, role, department) | 1h | D-04, S-01 | 3D Office shows 11 named desks; Yoda center, departments grouped spatially |

**Sprint 1 total:** 5h

#### Sprint 2: Department Tasks + Project Overview (Days 3-5)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC3-B-04 | `GET /api/projects` API route: scan workspace `projects/*/` directories, read README.md for title + description, read project markdown files for status/milestone data | 2h | S-01 | Returns typed JSON: `[{id, name, description, status, lastModified, taskCount}]` |
| SC-MCC3-B-05 | `GET /api/departments` + `GET /api/tasks` API routes: read task board markdown files from workspace; parse SC-MCC task ID format; group by department | 3h | S-01 | Returns tasks grouped by department with status (todo/in-progress/done) and assignee |
| SC-MCC3-B-06 | Project Overview page (`/projects`): list active projects with progress bar (% done), last updated, link to project folder | 2h | B-04 | Page shows all projects from `workspace/projects/`; progress derived from task completion ratio |
| SC-MCC3-B-07 | Department Tasks page (`/departments`): 7 department columns (Research, Architecture, Build, Design, QA, Growth, Reporting); task cards with status badge, priority, assignee, task ID | 3h | B-05, D-02 | All 7 departments visible; tasks update on page refresh; filter by status works |

**Sprint 2 total:** 10h

#### Sprint 3: Real-time Activity + Workflow Orchestration (Days 6-9)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC3-B-08 | Enhance existing agents page: add department grouping (Research/Architecture/Build/Design/QA/Growth/Reporting rows), show current session key + active subagent count per agent | 2h | S-01 | Agents page groups by department; shows "active" badge if session running |
| SC-MCC3-B-09 | Enhance existing activity SSE stream (`/api/activities/stream`): parse OpenClaw session JSONL files to extract live tool calls (tool_use events); map to agent names | 3h | S-01 | Live Activity feed shows "Luke: exec(npm test)", "R2: read(PROJECT_PLAN_v3)", etc. with <5s lag |
| SC-MCC3-B-10 | Real-time Agent Activity panel (new sidebar section): per-agent "current task" card showing agent name, current tool call, model, tokens this session; auto-refresh every 5s | 3h | B-09, B-08 | Home dashboard shows 11 agent cards; active agents show current tool call; idle agents show last activity |
| SC-MCC3-B-11 | Workflow Orchestration page (`/orchestrate`): replace static Carlos workflows with Steel City workflow definitions; add "Launch Workflow" button that sends task to specific agent via `chat.send` through OpenClaw Gateway | 4h | S-01, D-03 | Can select agent (Yoda/R2/etc.), type task, click Launch; task dispatched; confirmation shown |
| SC-MCC3-B-12 | `POST /api/orchestrate` route: validates payload, logs dispatch to activity DB, calls `openclaw` CLI to spawn subagent or send message to specified agent session | 4h | B-11 | API logs all dispatches; safety: rate limit 10 launches/hour; rejects unknown agent IDs |

**Sprint 3 total:** 16h

#### Sprint 4: mem0 Integration (Days 10-12)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC3-B-13 | `GET /api/memory/agents` route: query mem0 REST API (`/v1/memories/?user_id=mike`); group by agent_id metadata tag if present; cache 60s in-memory | 2h | S-01 | Returns memories array from mem0; includes agent association where tagged |
| SC-MCC3-B-14 | `GET /api/memory/search` route: extend existing file-based search to also query mem0 `POST /v1/memories/search/` with query; merge + deduplicate results | 2h | B-13 | Search results page shows both file memories and mem0 semantic results |
| SC-MCC3-B-15 | Extend Memory page (`/memory`): add "mem0 Memories" tab alongside existing file browser; per-agent filter dropdown; semantic search input; pagination (50/page) | 4h | B-13, B-14 | Memory page has two tabs: Files (existing) + mem0 Cloud (new); search works across both |

**Sprint 4 total:** 8h

#### Sprint 5: PM Integration Hook (Days 12-13)

| Task ID | Task | Effort | Deps | Acceptance Criteria |
|---------|------|--------|------|---------------------|
| SC-MCC3-B-16 | `POST /api/pm-sync` route: stub endpoint that accepts task data (id, title, status, assignee, department) and queues it for OBWON to process; writes to `data/pm-sync-queue.json` | 1h | S-01 | Endpoint accepts valid task payloads; queue file created; returns 202 Accepted |
| SC-MCC3-B-17 | PM sync status widget: small card on home dashboard showing queue depth, last sync timestamp, target PM tool name (configured via env var `PM_TOOL_NAME`) | 1h | B-16 | Widget visible on home; shows "Linear: 3 tasks pending sync" or similar |
| SC-MCC3-B-18 | OBWON integration docs: `docs/pm-sync-protocol.md` describing the queue format, how OBWON should consume it, and the task data schema | 1h | B-16 | Markdown doc in repo; OBWON can implement sync independently |

**Sprint 5 total:** 3h + 1h docs = **4h**

**Total Build effort:** ~55h net (Setup 3h + Branding 5h + Departments+Projects 10h + Activity+Orchestration 16h + mem0 8h + PM hook 4h)

---

### ✅ QA (Han) — Focused Audit

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC3-Q-01 | Security audit of new routes: path traversal in `/api/projects` and `/api/tasks` file readers; validate all paths are within allowed prefixes from `paths.ts` | 2h | High | No path escape possible; unit tests for path validation |
| SC-MCC3-Q-02 | Orchestration safety audit: `/api/orchestrate` input validation (agent ID allowlist, task length limit, rate limiting); ensure no arbitrary command injection | 2h | High | Penetration test: malformed payloads rejected; agent ID not in roster → 400 |
| SC-MCC3-Q-03 | End-to-end smoke test: auth flow, departments page, projects page, launch workflow, memory search (both file + mem0) | 2h | High | Manual test checklist; document pass/fail per feature |
| SC-MCC3-Q-04 | Cross-device check: Chrome desktop, Safari iOS (Mike's phone) — all new pages render correctly | 1h | Medium | No layout breaks; touch-friendly on mobile |
| SC-MCC3-Q-05 | Docker container validation: env vars correctly applied, workspace volume readable, port 3456 accessible, health endpoint returns 200 | 1h | High | `docker-compose up` clean start; remote access confirmed |

**QA total:** 8h

---

### 📣 GROWTH (Lando) — 1 task

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC3-G-01 | Steel City Mission Control User Guide: `docs/user-guide.md` covering all pages (existing tenacitOS + new SC panels), keyboard shortcuts, how to launch workflows, how to search mem0 | 2h | Low | Markdown doc covering every page; Mike can self-serve after reading it |

---

### 📊 REPORTING (Chewy) — 1 task

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC3-REP-01 | Project completion report: build time vs estimate, features delivered, outstanding backlog items | 1h | Low | Delivered when all milestones complete |

---

### 🗂️ PM-SYNC (OBWON) — 2 tasks

| Task ID | Task | Effort | Priority | Acceptance Criteria |
|---------|------|--------|----------|---------------------|
| SC-MCC3-PM-01 | Create all SC-MCC3-* tasks in project tracking tool with correct department labels and priority | 1h | High | All tasks visible; assigned to correct agent |
| SC-MCC3-PM-02 | Implement OBWON-side consumer of `data/pm-sync-queue.json` from the dashboard (per B-18 protocol) | 3h | Medium | OBWON reads queue, pushes to Linear/Jira, marks items synced |

---

### Task Summary

| Department | Agent | Tasks | Total Hours |
|------------|-------|-------|-------------|
| Setup (infra) | Luke | 3 | 3h |
| Design | Leia | 4 | 8h |
| Build | Luke | 18 | ~46h |
| QA | Han | 5 | 8h |
| Growth | Lando | 1 | 2h |
| Reporting | Chewy | 1 | 1h |
| PM-Sync | OBWON | 2 | 4h |
| **TOTAL** | | **34 tasks** | **~72h** |

*Note: 72h total vs 116h in v2. Hours are net new work only — tenacitOS's existing 40-60h of functionality is already built.*

---

## 6. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-01 | tenacitOS path assumptions (`/root/.openclaw`) break with our `/data/.openclaw` setup | High | High | **First action:** set `OPENCLAW_DIR` + `OPENCLAW_WORKSPACE` in `.env.local`; S-02 smoke test validates this |
| R-02 | tenacitOS uses Next.js 16 + React 19 — may have peer dependency issues with additional packages we add | Low | Medium | Lock package versions; test after each new `npm install` |
| R-03 | OpenClaw CLI (`openclaw sessions list`) not available inside Docker container | Medium | High | Test CLI access in container early (S-02); fallback: read JSONL files directly (tenacitOS already does this for sessions) |
| R-04 | mem0 API rate limits on free tier (107 existing memories, growing) | Medium | Medium | Cache responses 60s in-memory (B-13); display "cached" indicator; upgrade plan if needed |
| R-05 | Workflow Orchestration (`chat.send` dispatch) requires Gateway auth token | High | High | Store token in `.env.local`; B-12 reads from env; never hardcode |
| R-06 | Department task parsing fragile if task board markdown format changes | Medium | Low | Use loose regex parser; handle parse failures gracefully (show raw text fallback) |
| R-07 | JSONL session parsing for live activity is I/O intensive with 11 agents | Medium | Medium | Read only active sessions (check session status first); cache last 100 events per agent in memory |
| R-08 | tenacitOS branding vars deep in components (not all via env) | Low | Low | MacGyver already identified `branding.ts` as the entry point; do a `grep -r BRANDING` pass before styling |
| R-09 | Mike can't access dashboard remotely (port 3456 on loopback) | High | High | Must expose via Tailscale Serve or nginx; confirm with Mike before deploy |
| R-10 | New pages break existing tenacitOS tests/CI (if any exist) | Low | Low | No test suite found in tenacitOS repo; add new tests only for SC-specific code |

---

## 7. Milestone Timeline (Revised)

```
WEEK 1 (Days 1-5): FOUNDATION + CORE PANELS
  Day 1:
    ├── [Luke]  S-01, S-02, S-03 — Fork, configure, Docker validate
    ├── [Luke]  B-01, B-02, B-03 — Branding + agent roster
    ├── [Leia]  D-01 — Steel City brand spec (runs in parallel)
    └── [OBWON] SC-MCC3-PM-01 — Create tasks in PM tool
    🏁 END OF DAY 1: tenacitOS running with Steel City branding, 11 agents in 3D Office

  Days 2-3:
    ├── [Luke]  B-04, B-05 — Projects + Departments API routes
    ├── [Luke]  B-06, B-07 — Project Overview + Department Tasks pages
    └── [Leia]  D-02, D-03 — Task panel + Orchestration UX wireframes
    🏁 END OF DAY 3: Department Tasks and Project Overview pages live

  Days 4-5:
    ├── [Luke]  B-08, B-09 — Enhanced agents page + activity SSE
    ├── [Luke]  B-10 — Real-time agent activity cards
    └── [Han]   Q-01 — Path traversal security audit (new file routes)
    🏁 END OF WEEK 1 / MILESTONE 1:
      ✅ Steel City branded dashboard with dept tasks, projects, live agent activity
      Mike can see dashboard showing all 11 agents, projects, and departments

WEEK 2 (Days 6-10): ADVANCED FEATURES
  Days 6-7:
    ├── [Luke]  B-11 — Workflow Orchestration page (replace Carlos workflows)
    ├── [Luke]  B-12 — /api/orchestrate route with safety guards
    └── [Han]   Q-02 — Orchestration security audit (input validation)

  Days 8-9:
    ├── [Luke]  B-13, B-14 — mem0 API routes
    └── [Luke]  B-15 — Memory page mem0 tab
    🏁 END OF DAY 9 / MILESTONE 2:
      ✅ Workflow launcher live; Memory page shows mem0 + file results

  Day 10:
    ├── [Luke]  B-16, B-17, B-18 — PM sync hook + widget + docs
    ├── [Leia]  D-04 — 3D Office agent layout (11 agents, department zones)
    └── [OBWON] SC-MCC3-PM-02 — Wire up OBWON PM consumer

WEEK 3 (Days 11-15): QA + POLISH + DEPLOY
  Days 11-12:
    ├── [Han]   Q-03, Q-04 — E2E smoke test + cross-device check
    ├── [Luke]  Bug fixes from Han's findings
    └── [Lando] G-01 — User guide

  Days 13-14:
    ├── [Han]   Q-05 — Docker validation
    ├── [Luke]  Production Docker deploy (port 3456 behind reverse proxy)
    └── [Chewy] REP-01 — Completion report
    🏁 END OF WEEK 3 / MILESTONE 3 — PRODUCTION:
      ✅ Full Steel City Mission Control at https://[vps]/mission-control (or Tailscale URL)
      ✅ All 8 custom features working
      ✅ Passing security audit

TOTAL TIMELINE: ~3 weeks (15 working days)
VS v2 TIMELINE: 8 weeks
SAVINGS: 5 weeks
```

---

## 8. Next 48 Hours

**R2 will spawn these agents in this order:**

### Right Now (Day 1 Morning)

| # | Action | Who | Task | Notes |
|---|--------|-----|------|-------|
| 1 | 🚀 Spawn Leia | R2 → Leia | SC-MCC3-D-01: Steel City brand spec | Runs parallel with Luke; needs Mike sign-off before B-02 |
| 2 | 🚀 Spawn Luke | R2 → Luke | SC-MCC3-S-01 + S-02 + S-03: Fork, configure, Docker | **Start here** — everything depends on working tenacitOS instance |
| 3 | 🚀 Spawn OBWON | R2 → OBWON | SC-MCC3-PM-01: Create all v3 tasks in PM tool | Parallel track |

### After Luke Confirms S-01 + S-02 Pass

| # | Action | Who | Task |
|---|--------|-----|------|
| 4 | 🚀 Luke continues | Luke | B-01, B-02, B-03 (branding + agent roster) — needs Leia's D-01 first |
| 5 | 🚀 Spawn Han | R2 → Han | Stand by for Q-01 after B-04/B-05 complete |

### Day 2 Priority

| # | Action | Who | Task |
|---|--------|-----|------|
| 6 | Luke | B-04 → B-05 → B-06 → B-07 | Department + Project API + pages |
| 7 | Han | Q-01 | Security audit file routes |
| 8 | R2 | Stage review | Confirm Milestone 1 on track |

### Mike's First Checkpoint (End of Day 1)

Mike should see:
1. tenacitOS running with "Steel City AI" branding
2. 11 agents visible in 3D Office with correct names
3. All existing tenacitOS features working (costs, cron, sessions, system monitor)

**Mike approvals needed before proceeding:**
- ✅ Brand spec from Leia (D-01) → approve colors/palette before Luke applies them
- ✅ Confirm portal URL strategy: Tailscale Serve, nginx, or direct VPS port?

---

## 9. Open Decisions for Mike

Before Week 2 starts, Mike needs to decide:

| # | Decision | Options | Affects |
|---|---------|---------|---------|
| 1 | **Remote access** — how will you reach the dashboard? | A) Tailscale Serve (VPN-gated) B) nginx reverse proxy on VPS (public URL) C) Direct port (dev only) | Akbar + Luke deploy config |
| 2 | **PM Tool** — which system should OBWON sync to? | A) Linear B) Jira C) Asana D) None (dashboard-only) | SC-MCC3-PM-02, B-18 |
| 3 | **mem0 plan** — current free tier adequate? | A) Free tier + 60s cache (B-13) B) Upgrade to paid plan | B-13 implementation |
| 4 | **Orchestration scope** — workflow launcher sends to which agent? | A) Only to Yoda (main router) B) Can target any agent directly | B-11, B-12 safety scope |
| 5 | **Live tool call data** — is reading agent JSONL files acceptable latency (5s poll)? | A) Yes, 5s poll fine B) Need WebSocket push (harder) | B-09 implementation approach |

---

## Appendix A: File Locations

```
Project files:
/data/.openclaw/workspace/projects/mission-control-dashboard/
  PROJECT_PLAN_v3_TENACITOS.md  ← This file (active plan)
  PROJECT_PLAN_v2.md            ← Superseded (kept for reference)
  TENACITOS_EVALUATION.md       ← MacGyver's evaluation (2026-03-14)
  tenacitOS/                    ← Cloned repo — our working codebase
    src/config/branding.ts      ← Steel City brand config entry point
    src/components/Office3D/agentsConfig.ts  ← 11-agent roster
    .env.example                ← Template for .env.local
    src/lib/paths.ts            ← OPENCLAW_DIR path override needed

New docs to create:
  tenacitOS/docs/
    user-guide.md               ← Lando (SC-MCC3-G-01)
    pm-sync-protocol.md         ← Luke (SC-MCC3-B-18)
```

## Appendix B: Steel City Agent Roster (for agentsConfig.ts)

```typescript
// sc-agents.ts — import this into agentsConfig.ts
export const SC_AGENTS = [
  { id: "main",      name: "Yoda",   emoji: "🧙", role: "Router",        dept: "Operations",    color: "#FFB612", position: [0, 0, 0] },
  { id: "foreman",   name: "R2",     emoji: "🤖", role: "Foreman",       dept: "Operations",    color: "#C0C0C0", position: [-2, 0, -4] },
  { id: "research",  name: "3CP0",   emoji: "🔬", role: "Research",      dept: "Research",      color: "#4A90D9", position: [-6, 0, -4] },
  { id: "architect", name: "Akbar",  emoji: "🏗️", role: "Architecture",  dept: "Architecture",  color: "#7B68EE", position: [6, 0, -4] },
  { id: "build",     name: "Luke",   emoji: "⚡", role: "Build",         dept: "Build",         color: "#50C878", position: [-6, 0, 0] },
  { id: "design",    name: "Leia",   emoji: "🎨", role: "Design",        dept: "Design",        color: "#FF69B4", position: [6, 0, 0] },
  { id: "qa",        name: "Han",    emoji: "🛡️", role: "QA",            dept: "QA",            color: "#FF6347", position: [-6, 0, 4] },
  { id: "growth",    name: "Lando",  emoji: "📣", role: "Growth",        dept: "Growth",        color: "#FFA500", position: [6, 0, 4] },
  { id: "reporter",  name: "Chewy",  emoji: "📊", role: "Reporting",     dept: "Reporting",     color: "#8B4513", position: [-2, 0, 6] },
  { id: "pm-sync",   name: "OBWON",  emoji: "🗂️", role: "PM Sync",       dept: "Operations",    color: "#20B2AA", position: [2, 0, 6] },
  { id: "macgyver",  name: "MacGyver", emoji: "🔧", role: "DevTools",   dept: "Build",         color: "#DAA520", position: [2, 0, -4] },
];
```

## Appendix C: tenacitOS Pages We're Replacing/Extending

| Page | v3 Action | Notes |
|------|-----------|-------|
| `/workflows` | **Replace** static data with SC workflows + add Launch button | Carlos's Spanish workflows → Steel City team workflows |
| `/memory` | **Extend** with mem0 tab | Keep existing file browser; add new tab |
| `/agents` | **Extend** with department grouping | Keep existing data; add dept rows |
| `/` (home) | **Extend** with SC quick stats | Keep existing widgets; add PM sync widget + active agent count |
| **NEW: `/projects`** | **Add** project overview page | Reads workspace/projects/* |
| **NEW: `/departments`** | **Add** department tasks page | Reads task board markdown files |
| **NEW: `/orchestrate`** | **Add** workflow orchestration page | Replaces /workflows for SC use case |

---

*Plan v3 prepared by R2 (Foreman) on 2026-03-14*  
*Next review: End of Week 1 (Day 5) checkpoint with Mike*  
*Active branch: `steel-city` on tenacitOS fork*
