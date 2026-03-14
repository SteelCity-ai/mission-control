# Steel City AI — Mission Control Dashboard
## Design Specification v1.0

**Author:** Leia (Steel City AI Design/UX Agent)  
**Date:** 2026-03-14  
**Status:** Ready for Implementation  
**Target:** tenacitOS customization — Luke (build agent) drop-in

---

## Table of Contents
1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Component Library](#5-component-library)
6. [Agent Roster & Status Indicators](#6-agent-roster--status-indicators)
7. [Department Task Panel UX](#7-department-task-panel-ux)
8. [Workflow Orchestration UX](#8-workflow-orchestration-ux)
9. [Files to Modify](#9-files-to-modify)
10. [CSS Drop-in — Steel City Theme](#10-css-drop-in--steel-city-theme)
11. [Branding Config](#11-branding-config)

---

## 1. Brand Identity

### Mission Statement
**Steel City AI** is a Pittsburgh-based AI agent team. The Mission Control Dashboard is the nerve center — where human and machine intelligence converge to get things done.

### Name
**Primary:** "Steel City Command" (header, login page)  
**Secondary:** "Mission Control" (browser tab, abbreviated contexts)  
**Tagline:** "Where Steel Meets Silicon"

### Brand Personality
- **Industrial strength** — built for real work, not demos
- **Precision** — clear data, no decorative fluff
- **Urgency** — agents are always working; the UI reflects momentum
- **Pittsburgh pride** — steel heritage, Rust Belt grit

### Visual Language
- Dark industrial aesthetic — like a real mission control room
- Metallic surfaces with subtle texture (simulated via CSS gradients)
- Electric blue as the primary action color (connects to "AI" energy)
- Amber/gold as the secondary accent (Pittsburgh Steelers gold #FFB612)
- Gunmetal and brushed steel as the neutral palette
- Tight grid, dense information — this is a command center, not a landing page

---

## 2. Color System

### Core Palette

| Token | Hex | Description |
|-------|-----|-------------|
| `--bg` | `#0A0C0F` | Deepest background — near-black with blue undertone |
| `--background` | `#0A0C0F` | Alias for bg |
| `--surface` | `#111418` | Primary card/panel surface |
| `--surface-elevated` | `#1A1E24` | Inputs, elevated cards |
| `--surface-hover` | `#1E2430` | Hover states |
| `--card` | `#111418` | Alias for surface |
| `--card-elevated` | `#1A1E24` | Alias for surface-elevated |

### Borders

| Token | Hex | Description |
|-------|-----|-------------|
| `--border` | `#1E2836` | Default border — steel blue-dark |
| `--border-strong` | `#2A3A50` | Emphasized borders |

### Brand Accent — Electric Blue

| Token | Hex | Description |
|-------|-----|-------------|
| `--accent` | `#0EA5E9` | Primary action color (sky blue, high contrast on dark) |
| `--accent-soft` | `rgba(14, 165, 233, 0.12)` | Soft background for active states |
| `--accent-hover` | `#38BDF8` | Hover state |
| `--accent-muted` | `rgba(14, 165, 233, 0.08)` | Very subtle tint |

### Secondary Accent — Pittsburgh Gold

| Token | Hex | Description |
|-------|-----|-------------|
| `--gold` | `#FFB612` | Pittsburgh Steelers gold — premium highlights |
| `--gold-soft` | `rgba(255, 182, 18, 0.12)` | Gold soft background |
| `--gold-hover` | `#FFC233` | Gold hover |

### Text

| Token | Hex | Description |
|-------|-----|-------------|
| `--foreground` | `#E8EDF2` | Main text — slightly cool white |
| `--text-primary` | `#E8EDF2` | Primary text |
| `--text-secondary` | `#7A8FA8` | Secondary / labels |
| `--text-muted` | `#3D5066` | Muted / disabled |

### Status Colors

| Status | Token | Hex | Usage |
|--------|-------|-----|-------|
| Online / Done | `--positive` | `#22C55E` | Agent online, task done |
| At Risk / Busy | `--warning` | `#F59E0B` | Task at risk, agent busy |
| Blocked / Error | `--negative` | `#EF4444` | Task blocked, errors |
| Offline / Idle | `--neutral` | `#475569` | Agent offline, task pending |
| Info | `--info` | `#0EA5E9` | Informational (same as accent) |

#### Soft variants (backgrounds for badges):
```
--positive-soft: rgba(34, 197, 94, 0.12)
--warning-soft: rgba(245, 158, 11, 0.12)
--negative-soft: rgba(239, 68, 68, 0.12)
--neutral-soft: rgba(71, 85, 105, 0.15)
--info-soft: rgba(14, 165, 233, 0.12)
```

### Activity Type Colors (for activity feed icons)

| Type | Token | Hex |
|------|-------|-----|
| Build/Code | `--type-build` | `#F59E0B` |
| Research | `--type-research` | `#8B5CF6` |
| Design | `--type-design` | `#EC4899` |
| Message | `--type-message` | `#22C55E` |
| Command | `--type-command` | `#0EA5E9` |
| File | `--type-file` | `#06B6D4` |
| Search | `--type-search` | `#FFB612` |
| Cron | `--type-cron` | `#F97316` |
| Security | `--type-security` | `#EF4444` |

### Metallic Surface Gradients (CSS)
```css
/* Brushed steel header */
--gradient-steel: linear-gradient(135deg, #111418 0%, #1A1E24 50%, #111418 100%);

/* Gold highlight strip */
--gradient-gold: linear-gradient(90deg, #FFB612 0%, #FFC233 100%);

/* Blue glow (accent panel) */
--gradient-accent: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%);
```

---

## 3. Typography

### Font Stack
| Role | Font | Fallback | Variable |
|------|------|----------|----------|
| Headings | **Space Grotesk** | system-ui, sans-serif | `--font-heading` |
| Body | **Inter** | system-ui, sans-serif | `--font-body` |
| Mono / Logs | **JetBrains Mono** | monospace | `--font-mono` |

> **Implementation Note for Luke:** Replace `Sora` with `Space_Grotesk` in `src/app/layout.tsx`. Space Grotesk has a geometric, technical edge that reads "industrial AI" better than Sora.

### Type Scale

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|------------|----------------|-------|
| `display` | 32px | 700 | 1.1 | -2px | Page titles, hero numbers |
| `heading-1` | 24px | 700 | 1.2 | -1px | Section titles |
| `heading-2` | 18px | 600 | 1.3 | -0.5px | Card headers |
| `heading-3` | 16px | 600 | 1.4 | 0 | Sub-headers |
| `body-lg` | 15px | 400 | 1.6 | 0 | Primary body text |
| `body` | 14px | 400 | 1.6 | 0 | Standard body |
| `body-sm` | 13px | 400 | 1.5 | 0 | Secondary body |
| `label` | 12px | 500 | 1.4 | 0.5px | Labels, form fields |
| `caption` | 11px | 500 | 1.3 | 0.8px | Timestamps, hints |
| `badge` | 9px | 700 | 1 | 1px | Status badges (uppercase) |
| `mono` | 13px | 400 | 1.7 | 0 | Code, logs, IDs |

---

## 4. Spacing & Layout

### Spacing Scale
```
2px  — micro gap (badge internals)
4px  — tight (icon + label)
8px  — small (card padding compact)
12px — base (list item gap)
16px — medium (card padding, nav item padding)
20px — comfortable (section padding)
24px — large (card padding generous)
32px — xl (page section gap)
48px — 2xl (major section break)
```

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `2px` | Tiny chips |
| `--radius-sm` | `4px` | Badges, small chips |
| `--radius-md` | `8px` | Buttons, inputs, nav items |
| `--radius-lg` | `12px` | Cards, panels |
| `--radius-xl` | `16px` | Modal dialogs |
| `--radius-full` | `9999px` | Pills, status dots |

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);
--shadow-accent: 0 0 16px rgba(14, 165, 233, 0.2);
--shadow-gold: 0 0 16px rgba(255, 182, 18, 0.15);
```

### Layout Structure
```
Sidebar: 256px fixed (desktop) / full-screen overlay (mobile)
Main content: flex-1, min-width: 0
Max content width: 1440px
Mobile breakpoint: 768px
Tablet breakpoint: 1024px

Page padding: 24px desktop / 16px tablet / 12px mobile
Card gap: 16px desktop / 12px mobile
Grid cols: 12-column grid (desktop), 4-col (tablet), 1-col (mobile)
```

---

## 5. Component Library

### Sidebar
```
Width: 256px
Background: --surface (not --bg, so it reads as a distinct plane)
Right border: 1px solid --border
Brand area: 56px top section
  - Logo: ⚙️ or custom SVG gear icon (steel aesthetic)
  - Name: "Steel City Command" (Space Grotesk, 14px, 700)
  - Sub-name: "Mission Control" (caption, --text-muted)

Nav items:
  - Padding: 10px 16px
  - Border radius: --radius-md
  - Active: background --accent-soft, left border 3px solid --accent, text --accent
  - Inactive: color --text-secondary
  - Hover: background --surface-hover, color --text-primary

Department section headers (new):
  - Separator label: e.g. "COMMAND" / "INTEL" / "OPS"
  - Style: 9px, 700, --text-muted, 1px letter-spacing, 16px top margin

Footer:
  - Pittsburgh badge: small "🏙️ Pittsburgh, PA" label in --text-muted
  - Settings + Logout at bottom
```

### Cards / Panels
```
Background: --card (#111418)
Border: 1px solid --border
Border radius: --radius-lg (12px)
Padding: 20px (header area) / 16-24px (content area)
Section header: border-bottom 1px solid --border

Metallic card variant (for agent cards):
  Background: linear-gradient(135deg, --surface 0%, --surface-elevated 100%)
  Border: 1px solid --border-strong
  Box shadow: --shadow-md

Accent card variant (for primary metric):
  Border-left: 3px solid --accent
  Background: --gradient-accent
```

### Buttons
```
Primary (action):
  Background: --accent (#0EA5E9)
  Text: white
  Padding: 10px 20px
  Border radius: --radius-md
  Font: 14px, 600
  Hover: --accent-hover (#38BDF8), translateY(-1px), --shadow-accent

Gold (premium action, e.g. "Launch Workflow"):
  Background: --gold (#FFB612)
  Text: #0A0C0F (near-black for contrast)
  Same sizing as primary
  Hover: --gold-hover

Outline:
  Background: transparent
  Border: 1px solid --border
  Text: --text-primary
  Hover: border --border-strong, bg --surface

Ghost:
  Background: transparent
  Text: --text-secondary
  Hover: bg --surface-hover, text --text-primary

Danger:
  Background: --negative-soft
  Text: --negative
  Hover: rgba(239,68,68,0.2)

Sizes:
  sm: 7px 14px, 12px font
  md: 10px 20px, 14px font (default)
  lg: 12px 28px, 16px font
```

### Inputs
```
Background: --surface-elevated
Border: 1px solid --border
Border radius: --radius-md
Padding: 10px 14px
Font: 14px, --font-body
Placeholder: --text-muted
Focus: border --accent, box-shadow 0 0 0 3px rgba(14,165,233,0.15)
```

### Status Badges
```
Layout: inline-flex, align-center
Padding: 3px 8px
Border radius: --radius-sm
Font: 9px, 700, uppercase, 1px letter-spacing

Online/Done: bg --positive-soft, text --positive (#22C55E)
Busy/Warning: bg --warning-soft, text --warning (#F59E0B)
Blocked/Error: bg --negative-soft, text --negative (#EF4444)
Offline/Idle: bg --neutral-soft, text --neutral (#475569)
Info: bg --info-soft, text --info (#0EA5E9)
```

### Status Dots (Agent Indicators)
```
Size: 8px × 8px circle
Online: #22C55E with box-shadow 0 0 4px rgba(34,197,94,0.6)
Busy: #F59E0B with box-shadow 0 0 4px rgba(245,158,11,0.6)
Offline: #475569 (no glow)

Pulsing animation for online agents:
@keyframes pulse-online {
  0%, 100% { box-shadow: 0 0 4px rgba(34,197,94,0.6); }
  50% { box-shadow: 0 0 10px rgba(34,197,94,0.9); }
}
animation: pulse-online 2s ease-in-out infinite;
```

### Priority Indicators (Task Priority)
```
P0 — CRITICAL:
  Pill: bg rgba(239,68,68,0.15), text #EF4444, border 1px solid rgba(239,68,68,0.4)
  Icon: ⚡ or AlertTriangle

P1 — HIGH:
  Pill: bg rgba(245,158,11,0.12), text #F59E0B, border 1px solid rgba(245,158,11,0.3)
  Icon: ArrowUp

P2 — MEDIUM:
  Pill: bg rgba(14,165,233,0.12), text #0EA5E9, border 1px solid rgba(14,165,233,0.3)
  Icon: Minus

P3 — LOW:
  Pill: bg rgba(71,85,105,0.15), text #475569, border 1px solid rgba(71,85,105,0.3)
  Icon: ArrowDown
```

### Sidebar Logo / Brand Placement
```
Top of sidebar, 56px tall region:
  [LEFT]  ⚙️ (24px, --accent colored gear icon)
  [MID]   "STEEL CITY" (10px, 700, --text-muted, letter-spacing 2px)
  [BOT]   "Command" (14px, 700, --text-primary, Space Grotesk)

OR one-line variant for collapsed mode:
  ⚙️ SC  (abbreviated)

Pittsburgh accent: small 🏙️ badge or "PGH" text watermark at sidebar bottom
```

---

## 6. Agent Roster & Status Indicators

### The 11 Agents

| Agent ID | Name | Role | Emoji | Color Hex | Department |
|----------|------|------|-------|-----------|------------|
| `main` | Yoda | Router / Brain | 🧠 | `#0EA5E9` | Command |
| `foreman` | R2 | Project Planning | 🤖 | `#FFB612` | Command |
| `research` | 3CP0 | Research / Product | 📡 | `#8B5CF6` | Intel |
| `architect` | Akbar | System / Architecture | 🏗️ | `#06B6D4` | Engineering |
| `build` | Luke | Implementation | ⚡ | `#22C55E` | Engineering |
| `design` | Leia | Design / UX | 🎨 | `#EC4899` | Engineering |
| `qa` | Han | QA / Reliability | 🎯 | `#F97316` | Engineering |
| `growth` | Lando | Growth / Content | 📈 | `#A78BFA` | Growth |
| `reporter` | Chewy | Program Reporting | 📊 | `#FCD34D` | Ops |
| `pm-sync` | OBWON | PM Tool Sync | 📋 | `#34D399` | Ops |
| `macgyver` | MacGyver | Utility / Fixes | 🔧 | `#FB7185` | Ops |

### Agent Card Design
```
Size: min-width 160px (grid layout, 3-4 cols on desktop)
Shape: --radius-lg card

Structure:
┌─────────────────────────────────┐
│  [EMOJI 32px]       [●STATUS]   │
│                                 │
│  YODA                           │  ← 14px, 700, Space Grotesk
│  Brain Router                   │  ← 12px, --text-muted
│  ─────────────────────────────  │  ← 1px separator
│  claude-opus-4.6               │  ← 11px mono, --text-muted
│  [● Online] [Sessions: 2]      │  ← status badge + count
└─────────────────────────────────┘

Border: 2px solid [agent.color]
Background: gradient from --surface to --surface-elevated
Agent color tint: border-left 3px solid [agent.color], or 
                  background rgba([agent.color], 0.05)

Status overlay: top-right corner
  - Online: green dot with glow pulse
  - Busy: amber dot with glow
  - Offline: gray dot, no glow, card opacity 0.7
```

### Department Grouping for Agent Display
```
COMMAND    — Yoda, R2
INTEL      — 3CP0
ENGINEERING — Akbar, Luke, Leia, Han
GROWTH     — Lando
OPS        — Chewy, OBWON, MacGyver
```

---

## 7. Department Task Panel UX

### Overview
The task panel shows the current task backlog across departments with kanban + list hybrid views.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  DEPARTMENT TASKS                              [+ New Task]      │
│  ─────────────────────────────────────────────────────────────  │
│  [All] [Command] [Intel] [Engineering] [Growth] [Ops]           │
│  ─────────────────────────────────────────────────────────────  │
│  View: [☰ List] [⬛ Board]           Sort: [Priority ▼]        │
└─────────────────────────────────────────────────────────────────┘
```

### Department Filter Tabs
```css
/* Tab bar — horizontal scrollable on mobile */
.dept-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}

.dept-tab {
  padding: 6px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  white-space: nowrap;
  cursor: pointer;
}

.dept-tab:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.dept-tab.active {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: rgba(14, 165, 233, 0.3);
  font-weight: 600;
}
```

### Task Card Layout (List View)
```
┌──────────────────────────────────────────────────────────────────┐
│  [⚡P0] SC-BUILD-042   ↗                          [🔴 Blocked]   │
│  Implement mission control task board component                   │
│  ─────────────────────────────────────────────────────────────── │
│  👤 Luke (build)     🏷 Engineering    📅 Due: Mar 18            │
│  Deps: SC-ARCH-038 ✓   SC-DESIGN-041 ⏳                         │
│  ▓▓▓▓▓▓▓▓▒▒  75%                                                │
└──────────────────────────────────────────────────────────────────┘
```

**Task Card Component Spec:**
```
Background: --card
Border: 1px solid --border
Border-radius: --radius-lg
Padding: 16px
Hover: border --border-strong, bg slightly lighter

Top row (flex, space-between):
  LEFT: [Priority pill] [Task ID — mono 12px, --text-muted] [↗ Link icon]
  RIGHT: [Status badge]

Title:
  Font: 15px, 500, --text-primary
  Margin: 8px 0

Separator: 1px solid --border, margin 10px 0

Meta row (flex, gap 16px, 12px text):
  👤 [Assignee name] — --text-secondary
  🏷 [Department] — --text-muted
  📅 [Due date] — --text-muted

Dependencies row (if any):
  "Deps:" label + pill list
  ✓ = done (--positive)
  ⏳ = in progress (--warning)
  ⛔ = blocked (--negative)

Progress bar (if in_progress):
  Height: 4px
  Track: --surface-elevated
  Fill: linear-gradient(90deg, --accent 0%, --accent-hover 100%)
  Label: "75%" — 11px, --text-muted, text-right
```

### Board View (Kanban)
```
4 columns: TODO → IN PROGRESS → BLOCKED → DONE

Each column:
  Header: [Column name] [count badge]
  Width: 280px (horizontal scroll on smaller screens)
  Gap between cards: 8px

Column colors:
  TODO: border-top 3px solid --neutral (#475569)
  IN PROGRESS: border-top 3px solid --accent (#0EA5E9)
  BLOCKED: border-top 3px solid --negative (#EF4444)
  DONE: border-top 3px solid --positive (#22C55E)

Drag handle: 6px left strip, same color as column top border
Dragging state: box-shadow --shadow-accent, scale(1.02), opacity 0.9

Board layout:
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ TODO  [4]│ │PROGRESS 3│ │BLOCKED[1]│ │DONE  [12]│
│──────────│ │──────────│ │──────────│ │──────────│
│ [card]   │ │ [card]   │ │ [card]   │ │ [card]   │
│ [card]   │ │ [card]   │ │          │ │ [card]   │
│ [card]   │ │ [card]   │ │          │ │ [card]   │
│ [card]   │ │          │ │          │ │ [card]   │
│ [+ Add]  │ │          │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Progress Indicators
```
Task progress bar:
  Height: 6px (board view) / 4px (list view)
  0-33%: --negative color fill
  34-66%: --warning color fill
  67-99%: --accent color fill
  100%: --positive color fill

Department progress:
  Circular gauge (SVG arc) 40px diameter
  Stroke: 4px
  Track: --surface-elevated
  Fill: --accent
  Center text: "75%", 10px, 700

Sprint velocity mini-bar:
  Inline 48px wide bar chart (7 days)
  Fill: --accent at 40% opacity, hover 80%
```

---

## 8. Workflow Orchestration UX

### Layout Overview
```
┌───────────────────────────────────────────────────────────────────┐
│  WORKFLOW ORCHESTRATION                        [⚡ New Workflow]   │
│  ─────────────────────────────────────────────────────────────── │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐ │
│  │  WORKFLOW LAUNCHER          │  │  ACTIVITY FEED             │ │
│  │  (left panel, 40% width)    │  │  (right panel, 60% width)  │ │
│  └─────────────────────────────┘  └────────────────────────────┘ │
│  ─────────────────────────────────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ROUTING VISUALIZATION (full width, collapsible)            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Workflow Launcher Panel
```
STEP 1: Define Task
────────────────────
Label: Task Title *
Input: [text input, full width]
Placeholder: "e.g., Build task board component for dashboard"

Label: Description
Textarea: [3 rows, --font-body, 14px]

Label: Priority *
Segmented control (4 options):
  [⚡ P0] [↑ P1] [─ P2] [↓ P3]
  Active: accent/warning/info/neutral fill
  Width: equal segments, pill shape

STEP 2: Select Agents
────────────────────
Label: Route to Department
Select: [All] [Command] [Intel] [Engineering] [Growth] [Ops]
   — or — 
"Assign specific agents" toggle

Agent multi-select grid (3 cols):
  Each agent: [emoji] [name]
  Selected: border 2px solid --accent, bg --accent-soft

STEP 3: Set Parameters
────────────────────
Due date: [date input]
Dependencies: [tag input — type SC-XXX-NNN to add]
Related tasks: [task search autocomplete]

[─────────────────]

[Cancel]         [⚡ Launch Workflow →]
                 ← gold button for launch
```

### Activity Feed
```
Section header:
  "LIVE ACTIVITY" + pulsing green dot + "3 agents active"

Feed items (reverse chronological):
┌──────────────────────────────────────────────────────┐
│ ⚡ [Luke]  14:32  in_progress                        │
│   Working on TaskBoardComponent — 45% complete       │
│   └─ SC-BUILD-042                                    │
├──────────────────────────────────────────────────────┤
│ 📡 [3CP0]  14:28  completed                         │
│   Research complete: tenacitOS theme system analysis  │
│   └─ SC-RES-039 → handoff to Leia ✓                 │
├──────────────────────────────────────────────────────┤
│ 🧠 [Yoda]  14:25  routing                           │
│   New request routed: Mission Control theme design    │
│   └─ R2 → Leia                                      │
└──────────────────────────────────────────────────────┘

Each feed item:
  Background: --card on hover (else transparent)
  Left icon: 36px circle, bg rgba([agent.color], 0.12), agent emoji
  Agent name: 13px, 700, --text-primary
  Timestamp: 11px, --text-muted
  Status badge (inline): tiny pill
  Message: 13px, --text-secondary
  Task ref: 12px mono, --accent, underline on hover

"Load more" at bottom: ghost button
Auto-scroll: new items slide in from top with fade animation
```

### Routing Visualization
```
This is a simplified directed graph showing task flow.
Desktop: horizontal flow (left to right)
Mobile: collapsed, tap to expand

Nodes: Agent icons (emoji in circle)
Edges: Arrows between nodes showing task flow
Active path: --accent colored edges with animated dash
Completed: --positive colored edges (solid)
Pending: --border colored edges (dashed)

Example routing diagram:

  [Yoda 🧠] ──→ [R2 🤖] ──→ [3CP0 📡] ──→ [Leia 🎨]
                           └──→ [Akbar 🏗️] ──→ [Luke ⚡]
                                                    └──→ [Han 🎯]

Implementation: Use an SVG-based or canvas-based visualization.
For MVP, a simplified "breadcrumb arrow" chain suffices.

For each hop:
  Node circle: 48px, bg --surface-elevated, border 2px solid [agent.color]
  Emoji: 24px center
  Label below: 10px, --text-muted, agent name
  Arrow: SVG line, stroke --border-strong (idle) or --accent (active)
  
  Active hop: node gets box-shadow 0 0 16px rgba([agent.color], 0.4)
  Completed hop: green checkmark overlay on node corner
```

### Workflow History / Status
```
Below launcher, a compact list of recent workflows:

┌──────────────────────────────────────────────────────────────────┐
│ RECENT WORKFLOWS                                  [View all →]   │
├──────────────────────────────────────────────────────────────────┤
│ [✓] Mission Control Theme Design        P1  Leia  Mar 14  DONE  │
│ [⚡] Task Board Implementation          P1  Luke  Mar 14  75%   │
│ [⏳] Brand Research & Analysis           P2  3CP0  Mar 13  DONE  │
│ [─] Growth Content Calendar Q2          P3  Lando Mar 15  TODO  │
└──────────────────────────────────────────────────────────────────┘

Row:
  Status icon: 16px (checkmark green / spinner blue / blocked red / dash gray)
  Title: 14px, --text-primary
  Priority pill: tiny
  Assignee emoji + name: 12px, --text-muted
  Date: 11px, --text-muted
  Progress: inline mini bar (48px) or status badge
```

---

## 9. Files to Modify

| File | Change Required |
|------|----------------|
| `src/app/globals.css` | Replace all CSS variable values with Steel City theme (see Section 10) |
| `src/app/layout.tsx` | Replace `Sora` font with `Space_Grotesk`; update metadata title |
| `src/config/branding.ts` | Update defaults: agentName, companyName, appTitle, emoji |
| `src/components/Sidebar.tsx` | Update logo area: replace Terminal icon with gear/steel icon; add "Steel City Command" brand text; add dept sections |
| `src/app/(dashboard)/page.tsx` | Update hero title: "Steel City Command" + update subtitle |
| `public/` | Add `favicon.ico`, `apple-touch-icon.png` with Steel City mark |

### New Files to Create
| File | Purpose |
|------|---------|
| `src/app/(dashboard)/tasks/page.tsx` | Department Task Panel (new page) |
| `src/components/SteelCity/TaskCard.tsx` | Task card component |
| `src/components/SteelCity/TaskBoard.tsx` | Kanban board view |
| `src/components/SteelCity/DeptTabs.tsx` | Department filter tabs |
| `src/components/SteelCity/WorkflowLauncher.tsx` | Workflow launch form |
| `src/components/SteelCity/RoutingViz.tsx` | Task routing visualization |
| `src/components/SteelCity/index.ts` | Export barrel |

---

## 10. CSS Drop-in — Steel City Theme

**Luke:** Replace the entire `:root { }` block in `src/app/globals.css` with this. All other class styles can remain (they use these variables).

```css
/* ============================================
   Steel City AI — Mission Control Theme
   Pittsburgh-built, AI-powered
   Version: 1.0.0  |  Author: Leia (Design)
   ============================================ */

:root {
  /* ── Core Background ── */
  --bg: #0A0C0F;
  --background: #0A0C0F;
  --foreground: #E8EDF2;

  /* ── Surface Colors ── */
  --surface: #111418;
  --surface-elevated: #1A1E24;
  --surface-hover: #1E2430;
  --card: #111418;
  --card-elevated: #1A1E24;

  /* ── Borders ── */
  --border: #1E2836;
  --border-strong: #2A3A50;

  /* ── Primary Accent — Electric Blue ── */
  --accent: #0EA5E9;
  --accent-soft: rgba(14, 165, 233, 0.12);
  --accent-hover: #38BDF8;
  --accent-muted: rgba(14, 165, 233, 0.08);

  /* ── Secondary Accent — Pittsburgh Gold ── */
  --gold: #FFB612;
  --gold-soft: rgba(255, 182, 18, 0.12);
  --gold-hover: #FFC233;

  /* ── Text ── */
  --text-primary: #E8EDF2;
  --text-secondary: #7A8FA8;
  --text-muted: #3D5066;

  /* ── Semantic / Status ── */
  --positive: #22C55E;
  --positive-soft: rgba(34, 197, 94, 0.12);
  --negative: #EF4444;
  --negative-soft: rgba(239, 68, 68, 0.12);
  --warning: #F59E0B;
  --warning-soft: rgba(245, 158, 11, 0.12);
  --info: #0EA5E9;
  --info-soft: rgba(14, 165, 233, 0.12);
  --neutral: #475569;
  --neutral-soft: rgba(71, 85, 105, 0.15);

  /* ── Legacy aliases (keep for tenacitOS compat) ── */
  --success: #22C55E;
  --success-bg: rgba(34, 197, 94, 0.12);
  --error: #EF4444;
  --error-bg: rgba(239, 68, 68, 0.12);

  /* ── Activity Type Colors ── */
  --type-file: #06B6D4;
  --type-file-bg: rgba(6, 182, 212, 0.12);
  --type-search: #FFB612;
  --type-search-bg: rgba(255, 182, 18, 0.12);
  --type-message: #22C55E;
  --type-message-bg: rgba(34, 197, 94, 0.12);
  --type-command: #0EA5E9;
  --type-command-bg: rgba(14, 165, 233, 0.12);
  --type-cron: #F97316;
  --type-cron-bg: rgba(249, 115, 22, 0.12);
  --type-security: #EF4444;
  --type-security-bg: rgba(239, 68, 68, 0.12);
  --type-build: #F59E0B;
  --type-build-bg: rgba(245, 158, 11, 0.12);

  /* ── Typography ── */
  --font-heading: var(--font-space-grotesk), system-ui, sans-serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), monospace;

  /* ── Radius ── */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-accent: 0 0 16px rgba(14, 165, 233, 0.2);
  --shadow-gold: 0 0 16px rgba(255, 182, 18, 0.15);

  /* ── Metallic Gradients ── */
  --gradient-steel: linear-gradient(135deg, #111418 0%, #1A1E24 50%, #111418 100%);
  --gradient-gold: linear-gradient(90deg, #FFB612 0%, #FFC233 100%);
  --gradient-accent: linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0.04) 100%);
}

/* ── Agent Pulse Animation ── */
@keyframes pulse-online {
  0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.6); }
  50% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.9); }
}

@keyframes pulse-busy {
  0%, 100% { box-shadow: 0 0 4px rgba(245, 158, 11, 0.6); }
  50% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.9); }
}

/* ── Activity Feed Slide-in ── */
@keyframes feed-enter {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.feed-item-new {
  animation: feed-enter 0.3s ease-out forwards;
}

/* ── Steel City Gold Button ── */
.btn-gold {
  background: var(--gradient-gold);
  color: #0A0C0F;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 150ms ease;
}

.btn-gold:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-gold);
}

/* ── Status Dot ── */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.status-dot.online {
  background-color: var(--positive);
  animation: pulse-online 2s ease-in-out infinite;
}

.status-dot.busy {
  background-color: var(--warning);
  animation: pulse-busy 2s ease-in-out infinite;
}

.status-dot.offline {
  background-color: var(--neutral);
}

/* ── Priority Pill ── */
.priority-p0 {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.priority-p1 {
  background: rgba(245, 158, 11, 0.12);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.priority-p2 {
  background: rgba(14, 165, 233, 0.12);
  color: #0EA5E9;
  border: 1px solid rgba(14, 165, 233, 0.3);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.priority-p3 {
  background: rgba(71, 85, 105, 0.15);
  color: #475569;
  border: 1px solid rgba(71, 85, 105, 0.3);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* ── Department Tabs ── */
.dept-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}

.dept-tab {
  padding: 6px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  white-space: nowrap;
  cursor: pointer;
  transition: all 150ms ease;
}

.dept-tab:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.dept-tab.active {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: rgba(14, 165, 233, 0.3);
  font-weight: 600;
}

/* ── Progress Bar ── */
.progress-track {
  height: 4px;
  background: var(--surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%);
  transition: width 0.5s ease;
}

/* ── Kanban Board ── */
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 16px;
  align-items: flex-start;
}

.kanban-column {
  min-width: 280px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.kanban-column-header {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kanban-column.todo .kanban-column-header { border-top: 3px solid var(--neutral); }
.kanban-column.in-progress .kanban-column-header { border-top: 3px solid var(--accent); }
.kanban-column.blocked .kanban-column-header { border-top: 3px solid var(--negative); }
.kanban-column.done .kanban-column-header { border-top: 3px solid var(--positive); }

.kanban-cards {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
}

/* ── Routing Viz Node ── */
.routing-node {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--surface-elevated);
  border: 2px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  position: relative;
  flex-shrink: 0;
  transition: all 200ms ease;
}

.routing-node.active {
  box-shadow: 0 0 16px rgba(14, 165, 233, 0.4);
}

.routing-node.done::after {
  content: '✓';
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: var(--positive);
  border-radius: var(--radius-full);
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
}

/* ── Live Feed Indicator ── */
.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--positive);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--positive);
  border-radius: var(--radius-full);
  animation: pulse-online 1.5s ease-in-out infinite;
}
```

---

## 11. Branding Config

**Luke:** Update `src/config/branding.ts` defaults to:

```typescript
export const BRANDING = {
  agentName: process.env.NEXT_PUBLIC_AGENT_NAME || "Steel City Command",
  agentEmoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "⚙️",
  agentLocation: process.env.NEXT_PUBLIC_AGENT_LOCATION || "Pittsburgh, PA",
  birthDate: process.env.NEXT_PUBLIC_BIRTH_DATE || "",
  agentAvatar: process.env.NEXT_PUBLIC_AGENT_AVATAR || "",
  agentDescription: process.env.NEXT_PUBLIC_AGENT_DESCRIPTION || "Pittsburgh-based AI agent team — where steel meets silicon.",
  ownerUsername: process.env.NEXT_PUBLIC_OWNER_USERNAME || "steelcityai",
  ownerEmail: process.env.NEXT_PUBLIC_OWNER_EMAIL || "team@steelcityai.com",
  ownerCollabEmail: process.env.NEXT_PUBLIC_OWNER_COLLAB_EMAIL || "collabs@steelcityai.com",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@SteelCityAI",
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "STEEL CITY AI, LLC",
  appTitle: process.env.NEXT_PUBLIC_APP_TITLE || "Steel City Command",
} as const;
```

**Luke:** Update `src/app/layout.tsx` fonts:

```typescript
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

// Replace sora with spaceGrotesk in the body className
// body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}
```

**Luke:** Update `src/app/layout.tsx` metadata:
```typescript
export const metadata: Metadata = {
  title: "Steel City Command — Mission Control",
  description: "Pittsburgh-based AI agent team — where steel meets silicon.",
  themeColor: "#0EA5E9",
  // ... rest unchanged
};
```

---

## Quick Reference: Steel City Color Codes

| Name | Hex | CSS Token |
|------|-----|-----------|
| Black Steel | `#0A0C0F` | `--bg` |
| Steel Dark | `#111418` | `--surface` |
| Steel Mid | `#1A1E24` | `--surface-elevated` |
| Steel Blue Border | `#1E2836` | `--border` |
| Electric Blue | `#0EA5E9` | `--accent` |
| Pittsburgh Gold | `#FFB612` | `--gold` |
| Steel White | `#E8EDF2` | `--text-primary` |
| Steel Gray | `#7A8FA8` | `--text-secondary` |
| Online Green | `#22C55E` | `--positive` |
| Warning Amber | `#F59E0B` | `--warning` |
| Blocked Red | `#EF4444` | `--negative` |
| Offline Gray | `#475569` | `--neutral` |

---

*Spec complete. Hand off to Luke (build) for implementation.*  
*Questions or iteration requests → route through R2 → Leia.*
