# Mission Control Dashboard - Sprint Board (v3)

> 34 tasks | ~72h total effort | Timeline: 3 weeks

---

## 🏃 Sprint 1: Foundation + Design (Week 1)
**Goal:** tenacitOS running with Steel City branding, core setup complete

### Setup (3h)

| ID | Task | Owner | Est | Deps | Priority |
|----|------|-------|-----|------|----------|
| SC-MCC3-S-01 | Fork tenacitOS, create branch, set up .env.local | Luke | 1h | — | P0 |
| SC-MCC3-S-02 | Verify all tenacitOS features work | Luke | 1h | S-01 | P0 |
| SC-MCC3-S-03 | Create docker-compose.mission-control.yml | Luke | 1h | S-01 | P1 |

### Design (8h)

| ID | Task | Owner | Est | Deps | Priority |
|----|------|-------|-----|------|----------|
| SC-MCC3-D-01 | Steel City branding spec | Leia | 3h | — | P1 |
| SC-MCC3-D-02 | UX flow: Department Tasks panel | Leia | 2h | — | P1 |
| SC-MCC3-D-03 | UX flow: Workflow Orchestration panel | Leia | 2h | — | P2 |
| SC-MCC3-D-04 | 3D Office agent desk layout (11 agents) | Leia | 1h | — | P3 |

### Build - Sprint 1 (5h)

| ID | Task | Owner | Est | Deps | Priority |
|----|------|-------|-----|------|----------|
| SC-MCC3-B-01 | Apply Steel City branding | Luke | 1h | D-01, S-01 | P1 |
| SC-MCC3-B-02 | Tailwind theme override | Luke | 3h | D-01 | P1 |
| SC-MCC3-B-03 | Agent Roster Config (11 agents) | Luke | 1h | D-04, S-01 | P1 |

---

## ⚡ Sprint 2: Core Build (Week 2)
**Goal:** Department Tasks, Project Overview, Real-time Activity, Workflow Orchestration live

### Build - Sprint 2 (16h)

| ID | Task | Owner | Est | Deps | Priority |
|----|------|-------|-----|------|----------|
| SC-MCC3-B-04 | GET /api/projects API route | Luke | 2h | S-01 | P1 |
| SC-MCC3-B-05 | GET /api/departments + GET /api/tasks | Luke | 3h | S-01 | P1 |
| SC-MCC3-B-06 | Project Overview page (/projects) | Luke | 2h | B-04 | P1 |
| SC-MCC3-B-07 | Department Tasks page (/departments) | Luke | 3h | B-05, D-02 | P1 |
| SC-MCC3-B-08 | Enhance agents page (dept grouping) | Luke | 2h | S-01 | P1 |
| SC-MCC3-B-09 | Enhance activity SSE stream | Luke | 3h | S-01 | P1 |
| SC-MCC3-B-10 | Real-time Agent Activity panel | Luke | 3h | B-09, B-08 | P1 |
| SC-MCC3-B-11 | Workflow Orchestration page | Luke | 4h | S-01, D-03 | P1 |
| SC-MCC3-B-12 | POST /api/orchestrate route | Luke | 4h | B-11 | P1 |

---

## ✅ Sprint 3: QA + Polish + Deploy (Week 3)
**Goal:** All features working, security passed, deployed to production

### Build - Final (8h)

| ID | Task | Owner | Est | Deps | Priority |
|----|------|-------|-----|------|----------|
| SC-MCC3-B-13 | GET /api/memory/agents route | Luke | 2h | S-01 | P2 |
| SC-MCC3-B-14 | GET /api/memory/search route | Luke | 2h | B-13 | P2 |
| SC-MCC3-B-15 | Extend Memory page (mem0 tab) | Luke | 4h | B-13, B-14 | P2 |
| SC-MCC3-B-16 | POST /api/pm-sync route | Luke | 1h | S-01 | P2 |
| SC-MCC3-B-17 | PM sync status widget | Luke | 1h | B-16 | P3 |
| SC-MCC3-B-18 | OBWON integration docs | Luke | 1h | B-16 | P3 |

### QA (8h)

| ID | Task | Owner | Est | Deps | Priority |
|----|------|-------|-----|------|----------|
| SC-MCC3-Q-01 | Security audit: path traversal | Han | 2h | — | P0 |
| SC-MCC3-Q-02 | Orchestration safety audit | Han | 2h | — | P0 |
| SC-MCC3-Q-03 | End-to-end smoke test | Han | 2h | — | P0 |
| SC-MCC3-Q-04 | Cross-device check | Han | 1h | — | P1 |
| SC-MCC3-Q-05 | Docker container validation | Han | 1h | — | P0 |

### Growth + Reporting + PM (7h)

| ID | Task | Owner | Est | Deps | Priority |
|----|------|-------|-----|------|----------|
| SC-MCC3-G-01 | User Guide | Lando | 2h | — | P3 |
| SC-MCC3-REP-01 | Project completion report | Chewy | 1h | — | P3 |
| SC-MCC3-PM-01 | Create tasks in PM tool | OBWON | 1h | — | P0 |
| SC-MCC3-PM-02 | Implement PM queue consumer | OBWON | 3h | B-18 | P2 |

---

## 📊 Summary

### By Department

| Department | Tasks | Hours |
|------------|-------|-------|
| Build | 21 | ~46h |
| Design | 4 | 8h |
| QA | 5 | 8h |
| Setup (Build) | 3 | 3h |
| PM-Sync | 2 | 4h |
| Growth | 1 | 2h |
| Reporting | 1 | 1h |
| **TOTAL** | **34** | **~72h** |

### By Priority

| Priority | Tasks | % |
|----------|-------|---|
| P0 (Critical) | 12 | 35% |
| P1 (High) | 14 | 41% |
| P2 (Medium) | 6 | 18% |
| P3 (Low) | 2 | 6% |

### By Sprint

| Sprint | Tasks | Hours | Goal |
|--------|-------|-------|------|
| Sprint 1 | 10 | 16h | Foundation + Design |
| Sprint 2 | 9 | 16h | Core Build |
| Sprint 3 | 18 | 40h | QA + Polish + Deploy |

### Critical Path (Longest Chain)

```
S-01 → S-02 → S-03 (Setup)
    ↘
    └→ B-01 → B-02 → B-03 (Branding)
        ↘
        └→ B-04 → B-05 → B-07 (Dept Tasks)
            ↘
            └→ B-09 → B-10 (Activity)
                ↘
                └→ B-11 → B-12 (Orchestration)
                    ↘
                    └→ Q-02 (Security Audit)
```

### Flagged Items

⚠️ **PM Tool Decision Pending:** SC-MCC3-PM-01 and SC-MCC3-PM-02 depend on Mike's decision (Linear/Jira/Asana)

⚠️ **mem0 API:** Tasks B-13, B-14, B-15 depend on mem0 API access and may need paid tier

⚠️ **Remote Access:** R-09 risk - Mike needs to confirm access method (Tailscale/ngrok/direct)

---

*Last updated: 2026-03-14 | Prepared by: OBWON*
