# Steel City AI — Design System
**Mission Control Dashboard** | Version 1.1.0 | Author: Leia (Design Agent)

---

## Brand Identity

### Core Values
- **Steel meets Silicon** — industrial Pittsburgh grit + cutting-edge AI
- Dark-first interface (no light mode needed for a command center)
- High information density without visual clutter
- Every element earns its place

### Color Palette

#### Primary Colors (STE-47: Tailwind v4 `@theme` registered)
| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Pittsburgh Gold | `bg-gold-500`, `text-gold-500` | `#FFB612` | Primary actions, Yoda, key highlights |
| Electric Blue | `bg-electric-500`, `text-electric-500` | `#0EA5E9` | Accent, links, active states |
| Steel Dark | `bg-steel-900` | `#111418` | Card backgrounds |
| Steel Base | `bg-steel-950` | `#0A0C0F` | Page background |

#### Status Colors
| State | Color | CSS Var |
|-------|-------|---------|
| Online/Success | `#22C55E` | `--positive` |
| Warning/In-Progress | `#F59E0B` | `--warning` |
| Error/Blocked | `#EF4444` | `--negative` |
| Offline/Neutral | `#475569` | `--neutral` |

### Typography
- **Headings**: Space Grotesk — tight letter-spacing (`-1.5px`), weights 600-700
- **Body**: Inter — neutral, readable, system fallback
- **Mono**: JetBrains Mono — code, IDs, model names

---

## Tailwind v4 Theme (STE-47)

Tailwind v4 uses CSS-first configuration via `@theme {}` in `globals.css`.
**No `tailwind.config.ts` needed** — all brand tokens live in the `@theme` block.

Available utility prefixes:
```
bg-steel-{50-950}
text-steel-{50-950}
bg-electric-{50-950}
text-electric-{50-950}
bg-gold-{50-950}
text-gold-{50-950}
```

Examples:
```tsx
<div className="bg-steel-900 border border-steel-600">
  <span className="text-electric-500">Active</span>
  <span className="text-gold-500">⚡ Pittsburgh Gold</span>
</div>
```

---

## Office 3D Layout (STE-45)

### Floor Plan (top-down, 11 agents, 4 rows)

```
BACK WALL  ←─────────────────────────────→
           [-5]        [0]         [+5]

  z=-6   🔬 3CP0    🧙 Yoda    🏗️ Akbar
         Research   Command    Architecture

  z=-2   ⚡ Luke    🔧 MacGvyr  🎨 Leia
         Build      Build       Design

  z=+2   🤖 R2     🗂️ OBWON   🛡️ Han
         Foreman    PM Sync     QA

  z=+6   📊 Chewy   📣 Lando
         Reporting  Growth

ENTRANCE ←─────────────────────────────→
```

### Department Zone Colors
| Department | Color | Agents |
|-----------|-------|--------|
| Operations | `#FFB612` (Gold) | Yoda, R2, OBWON |
| Research | `#8B5CF6` (Violet) | 3CP0 |
| Architecture | `#F59E0B` (Amber) | Akbar |
| Build | `#22C55E` (Emerald) | Luke, MacGyver |
| Design | `#EC4899` (Pink) | Leia |
| QA | `#EF4444` (Red) | Han |
| Growth | `#F97316` (Orange) | Lando |
| Reporting | `#D97706` (Warm Gold) | Chewy |

---

## Component Polish (Visual Improvements)

### StatsCard
- ✅ Hover: border color matches icon, subtle lift (`translateY(-2px)`)
- ✅ Icon wrapped in colored backing (`18% opacity bg`)
- ✅ Glow shadow on hover

### Project Cards (Dashboard)
- ✅ Hover: electric accent border + shadow glow
- ✅ Progress bar: gradient-colored based on completion %
- ✅ Task count: labeled inline (done/active/blocked)
- ✅ Status pill: proper border outline

### Kanban Cards (Departments)
- ✅ Hover: column color bleeds into card border
- ✅ Lift + shadow on hover (no jank from scale transforms)
- ✅ Kanban columns: top border uses column status color (no CSS override conflict)

### Department Filter Tabs
- ✅ Emoji prefix per department
- ✅ Active tab: colored background tint + colored underline matching dept
- ✅ Consistent with `dept-tab` CSS class pattern

### Department Legend (Agents Page)
- ✅ Upgraded from dot + text to colored pill badges
- ✅ Each badge: colored border, tinted background, matching text

### Agent Cards (Agents Page)
- ✅ Base border: subtle agent color tint (`30%` opacity)
- ✅ Hover: stronger agent color border + glow shadow
- ✅ Tab switcher: fixed CSS conflict, uses proper pill style

---

## CSS Classes Reference

| Class | Purpose |
|-------|---------|
| `.kanban-board` | Horizontal flex scrollable board |
| `.kanban-column` | Single status column |
| `.kanban-column-header` | Column header with icon + count |
| `.kanban-cards` | Card stack container |
| `.status-dot` | Pulsing status indicator (`.online`, `.busy`, `.offline`) |
| `.agent-card` | Agent card with metallic gradient |
| `.dept-tab` / `.dept-tab.active` | Department filter tab |
| `.priority-p0` through `.priority-p3` | Priority pill variants |
| `.badge-success` / `.badge-error` etc | Status badge variants |
| `.btn-gold` | Pittsburgh Gold CTA button |
| `.btn-primary` / `.btn-outline` | Standard button variants |
| `.card-metallic` | Steel gradient card |
| `.card-accent` | Electric blue left-border accent |
| `.card-gold` | Gold left-border accent |
| `.live-indicator` | Pulsing LIVE badge |
| `.accent-line` | 24px accent underline for section headers |
