# Steel City Mission Control — Setup Notes

**Date:** 2026-03-14  
**Agent:** Luke (Build)  
**Status:** ✅ Setup Complete

---

## What Was Accomplished

### 1. Project Fork (S-01)
- ✅ Copied tenacitOS to `steelcity-mission-control/`
- Location: `/data/.openclaw/workspace/projects/mission-control-dashboard/steelcity-mission-control/`

### 2. Environment Configuration
- ✅ Created `.env.local` with correct paths:
  - `OPENCLAW_DIR=/data/.openclaw` (overrides default `/root/.openclaw`)
  - `OPENCLAW_WORKSPACE=/data/.openclaw/workspace`
  - `NEXT_PUBLIC_GATEWAY_WS=ws://127.0.0.1:18789`
- ✅ Admin password set to: `steel-city-2026`
- ✅ Auth secret configured

### 3. Dependencies
- ✅ `npm install` successful
- 5 vulnerabilities (3 moderate, 2 high) — not blocking, can address later

### 4. Build Test
- ✅ `npm run dev` runs successfully on port 3456
- Server accessible at: http://localhost:3456
- Login page renders correctly

### 5. Basic Branding Applied
Updated the following files with Steel City branding:

| File | Changes |
|------|---------|
| `.env.local` | App title, company name, emoji, theme |
| `src/config/branding.ts` | Added `themeName` property |
| `src/app/layout.tsx` | Uses BRANDING.appTitle in metadata |
| `src/app/login/page.tsx` | Uses BRANDING for title, emoji, footer |
| `src/components/Sidebar.tsx` | Uses BRANDING.appTitle in header |
| `src/app/(dashboard)/page.tsx` | Uses BRANDING for header |

**Branding Values Applied:**
- App Title: "Steel City AI — Mission Control"
- Company Name: "STEEL CITY AI"
- Agent Emoji: 🏭
- Agent Description: "The Steel City AI Agent Team — Pittsburgh's finest autonomous workforce"
- Theme Name: "steel-city"

### 6. Agent Roster Configured
- ✅ Updated `src/components/Office3D/agentsConfig.ts` with all 11 Steel City agents:
  - Yoda (main) — Operations — 🧙 — #FFB612 (gold)
  - R2 (foreman) — Operations — 🤖 — #C0C0C0 (silver)
  - 3CP0 (research) — Research — 🔬 — #4A90D9 (steel blue)
  - Akbar (architect) — Architecture — 🏗️ — #7B68EE (slate blue)
  - Luke (build) — Build — ⚡ — #50C878 (emerald)
  - Leia (design) — Design — 🎨 — #FF69B4 (hot pink)
  - Han (qa) — QA — 🛡️ — #FF6347 (tomato)
  - Lando (growth) — Growth — 📣 — #FFA500 (orange)
  - Chewy (reporter) — Reporting — 📊 — #8B4513 (brown)
  - OBWON (pm-sync) — Operations — 🗂️ — #20B2AA (teal)
  - MacGyver — Build — 🔧 — #DAA520 (goldenrod)

---

## What Works

1. ✅ Dev server starts on port 3456
2. ✅ Login page shows Steel City branding
3. ✅ Environment variables correctly override tenacitOS defaults
4. ✅ Agent roster in 3D Office config has all 11 agents

---

## What Doesn't Work (Needs Mike's Help)

1. **Port conflict** - Port 54549 (default Next.js) was in use; using 3456 as alternate
2. **Hardcoded strings remain** - Some files still have "Mission Control" / "Tenacitas" text that could be updated:
   - `src/app/(dashboard)/workflows/page.tsx` - Spanish workflow descriptions
   - `src/app/(dashboard)/logs/page.tsx` - Log backend label
   - `src/app/api/health/route.ts` - Health check name
   - `src/app/api/agents/route.ts` - Fallback name
   - `src/app/api/system/monitor/route.ts` - Service labels
   - `src/app/(dashboard)/settings/page.tsx` - Version string
   - `src/app/office/page.tsx` - Office page title

3. **No production build tested** - Only dev server tested

---

## Next Steps (For Future Sprints)

1. **Full branding** - Replace remaining hardcoded strings (listed above)
2. **Test login** - Login with password `steel-city-2026` and verify dashboard works
3. **Docker setup** - Create `docker-compose.mission-control.yml` (S-03)
4. **Production build** - Test `npm run build` for production
5. **QA smoke test** - Verify all tenacitOS features work with our data (S-02)

---

## Project Structure

```
steelcity-mission-control/
├── .env.local              # Steel City config (password: steel-city-2026)
├── src/
│   ├── config/
│   │   └── branding.ts     # Added themeName
│   ├── components/
│   │   ├── Office3D/
│   │   │   └── agentsConfig.ts  # 11 Steel City agents
│   │   └── Sidebar.tsx     # Uses BRANDING.appTitle
│   └── app/
│       ├── layout.tsx      # Uses BRANDING in metadata
│       ├── login/
│       │   └── page.tsx    # Uses BRANDING
│       └── (dashboard)/
│           └── page.tsx    # Uses BRANDING
└── package.json
```

---

## Commands

```bash
# Start dev server
cd /data/.openclaw/workspace/projects/mission-control-dashboard/steelcity-mission-control
PORT=3456 npm run dev

# Login credentials
# Password: steel-city-2026
```