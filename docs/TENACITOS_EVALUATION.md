# tenacitOS Evaluation for Steel City AI Mission Control Dashboard

## Executive Summary

tenacitOS is a production-ready Next.js 16 dashboard for OpenClaw agent management. It reads directly from OpenClaw's config and session data without requiring a separate database. The app runs successfully on port 3456 (dev mode).

---

## What tenacitOS Does Well ✅

| Feature | Status | Notes |
|---------|--------|-------|
| **System Monitor** | ✅ | Real-time CPU, RAM, Disk, Network, PM2/Docker status |
| **Agent Dashboard** | ✅ | All agents, sessions, token usage, model, activity status |
| **Cost Tracking** | ✅ | Real cost analytics from OpenClaw SQLite databases |
| **Cron Manager** | ✅ | Visual cron manager with weekly timeline, run history |
| **Activity Feed** | ✅ | Real-time log of agent actions with heatmap/charts |
| **Memory Browser** | ✅ | Explore, search, edit agent memory files |
| **File Browser** | ✅ | Navigate workspace with preview and in-browser editing |
| **Global Search** | ✅ | Full-text search across memory and workspace files |
| **Notifications** | ✅ | Real-time notification center with unread badge |
| **Office 3D** | ✅ | Interactive 3D office with one desk per agent (React Three Fiber) |
| **Terminal** | ✅ | Read-only terminal for safe status commands |
| **Auth** | ✅ | Password-protected with rate limiting (5 failed → 15min lockout) |

### Data Sources Identified

- **openclaw.json** — Agent list, channels, models config
- **`openclaw sessions list --json`** — Session data
- **Session JSONL files** (`agents/main/sessions/{uuid}.jsonl`) — Message history
- **Workspace files** — MEMORY.md, SOUL.md, TOOLS.md, etc.
- **SQLite databases** — Cost tracking via `usage-collector.ts`

---

## Gap Analysis: Steel City Needs

| Requirement | tenacitOS Status | Gap Assessment |
|-------------|------------------|----------------|
| **Project overview (active projects, progress)** | ❌ | No project tracking concept |
| **Department tasks (Research, Architecture, Build, Design, QA, Growth, Reporting)** | ❌ | No department-based organization; workflows are hardcoded for Carlos's personal use |
| **Real-time agent activity (what each agent is working on)** | 🔧 | Partial — shows online/offline status and last activity timestamp, but not current task |
| **Workflow orchestration (kick off/route workflows)** | 🔧 | Displays workflows but no execution capability — hardcoded steps, no API triggers |
| **Agent status (online/offline, current model, session health)** | ✅ | Full support |
| **Memory/context viewer (mem0 integration)** | 🔧 | Only file-based memory (MEMORY.md); no mem0 integration |
| **Steel City AI branding (steel-dark theme)** | ❌ | Default orange/dark theme; needs full retheming |

### Feature Comparison

- ✅ = tenacitOS has it
- ❌ = missing, need to build
- 🔧 = exists but needs customization

---

## Customization Requirements

### High Effort

1. **Department Tasks View** — Requires new data model + UI; no current concept of departments
2. **Workflow Kick-off** — Needs API endpoints to trigger OpenClaw commands; currently display-only
3. **mem0 Integration** — New data source integration; currently reads file-based memory only

### Medium Effort

1. **Steel City Branding** — CSS/Tailwind theme changes; new logo assets
2. **Project Overview** — Could adapt Sessions view with custom metadata
3. **Real-time Activity Detail** — Could enhance agent API with current task tracking

### Low Effort

1. **Environment Configuration** — Set ADMIN_PASSWORD, AUTH_SECRET, branding vars
2. **Office 3D Agents** — Update `agentsConfig.ts` with Steel City agent roster

---

## Estimated Effort

| Approach | Effort | Notes |
|----------|--------|-------|
| **Customize tenacitOS** | **40-60 hours** | Departments, workflows, mem0, branding |
| **Build from scratch** | **80-120 hours** | Full custom UI with Steel City requirements |

**Recommendation:** Customize tenacitOS — it provides 70% of needed functionality out of the box.

---

## Blockers & Concerns

1. **No department concept** — tenacitOS models agents as flat list; Steel City needs Research/Architecture/Build/Design/QA/Growth/Reporting departments
2. **Workflows are hardcoded** — The workflows page contains Carlos's personal workflows as static data; need dynamic workflow creation/triggering
3. **mem0 not integrated** — Memory is file-based only; mem0 API integration needed
4. **No project tracking** — Need to add project data model
5. **Branding** — Steel-dark theme requires comprehensive CSS changes

---

## Recommended Next Steps

1. **Set up environment** — Create `.env.local` with admin password, auth secret, Steel City branding
2. **Customize theme** — Create Steel City dark theme in Tailwind
3. **Add department structure** — Modify agent data model to include department info
4. **Enhance workflows** — Add API endpoints for workflow trigger execution
5. **Integrate mem0** — Add mem0 API client to replace file-based memory viewer
6. **Deploy** — Run behind reverse proxy with HTTPS in production

---

## Tech Stack

- Next.js 16 (App Router)
- React 19 + Tailwind CSS v4
- React Three Fiber + Drei (3D Office)
- Recharts (charts)
- Lucide React (icons)
- better-sqlite3 (cost tracking)
- Node.js 22

---

## Files Examined

- `README.md` — Full feature documentation
- `package.json` — Dependencies
- `src/lib/paths.ts` — OpenClaw path configuration
- `src/app/api/agents/route.ts` — Agent discovery from openclaw.json
- `src/app/api/sessions/route.ts` — Session listing via CLI
- `src/app/api/system/route.ts` — System info and integrations
- `src/app/(dashboard)/workflows/page.tsx` — Workflow display (static)
- `.env.example` — Environment template
