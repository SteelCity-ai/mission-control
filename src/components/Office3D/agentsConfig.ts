/**
 * Office 3D — Steel City Agent Configuration
 * STE-45: 3D Office agent desk layout for all 11 agents
 *
 * This file defines the visual layout of agents in the 3D office.
 * Updated for Steel City AI team (11 agents, 7 departments).
 *
 * Agent IDs correspond to workspace directory suffixes:
 *   id: "main"     → workspace/          (main agent - Yoda)
 *   id: "foreman"  → workspace-foreman/  (R2)
 *   etc.
 *
 * Layout — top-down view (looking -Z is "forward"):
 *
 *  ┌──────────────────────────────────────────────┐
 *  │  BACK WALL                                   │
 *  │                                              │
 *  │  [Research 3CP0]  [Yoda: CENTER]  [Akbar]   │  z = -6
 *  │                                              │
 *  │  [Luke Build]  [MacGyver]  [Design Leia]     │  z = -2
 *  │                                              │
 *  │  [R2 Foreman]  [OBWON PM]  [Han QA]         │  z = 2
 *  │                                              │
 *  │  [Chewy Report]  [Lando Growth]              │  z = 6
 *  │                                              │
 *  │  ENTRANCE                                    │
 *  └──────────────────────────────────────────────┘
 *
 * Department groupings:
 *  - Operations: Yoda (main), R2 (foreman), OBWON (pm-sync)
 *  - Research:   3CP0 (research)
 *  - Architecture: Akbar (architect)
 *  - Build:      Luke (build), MacGyver (macgyver)
 *  - Design:     Leia (design)
 *  - QA:         Han (qa)
 *  - Growth:     Lando (growth)
 *  - Reporting:  Chewy (reporter)
 */

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  position: [number, number, number]; // x, y, z
  color: string;
  role: string;
  department: string;
  /** Department group for desk clustering */
  deptGroup: "operations" | "research" | "architecture" | "build" | "design" | "qa" | "growth" | "reporting";
}

// Steel City color palette (aligned with globals.css --color-* values)
const COLORS = {
  // Pittsburgh Gold — Operations (command)
  gold:       "#FFB612",  // --color-gold-500
  goldLight:  "#FFC233",  // --color-gold-400
  // Electric Blue — Electric/Tech roles
  electric:   "#0EA5E9",  // --color-electric-500
  electricDim: "#38BDF8", // --color-electric-400
  // Steel tones — Architecture / Infrastructure
  steel:      "#7A8FA8",  // --color-steel-300
  steelBright: "#A8B8C8", // --color-steel-200
  // Accent greens — Build / Engineering
  emerald:    "#22C55E",  // --color-steel-green-500
  teal:       "#14B8A6",
  cyan:       "#06B6D4",  // --color-steel-cyan-500
  // Accent purples — Research / Architecture
  violet:     "#8B5CF6",
  indigo:     "#6366F1",
  // Accent warm — Growth / Marketing
  orange:     "#F97316",
  amber:      "#F59E0B",  // --color-steel-amber-500
  // Accent cool — Design / UX
  pink:       "#EC4899",
  rose:       "#F43F5E",
  // Accent red — QA / Reliability
  red:        "#EF4444",  // --color-steel-red-500
  // Reporting — warm brown / saddle
  brown:      "#92400E",
  warmGold:   "#D97706",
} as const;

// Steel City Agent Roster — 11 agents across 8 departments
// Desk layout is a 3-column grid (x: -5, 0, 5) across 4 rows (z: -6, -2, 2, 6)
export const AGENTS: AgentConfig[] = [

  // ── ROW 1 (z = -6): Command / Research / Architecture ──────────────────

  {
    id: "research",
    name: "3CP0",
    emoji: "🔬",
    position: [-5, 0, -6],
    color: COLORS.violet,
    role: "Research & Product",
    department: "Research",
    deptGroup: "research",
  },
  {
    id: "main",
    name: "Yoda",
    emoji: "🧙",
    position: [0, 0, -6],  // Center front — facing the whole office
    color: COLORS.gold,
    role: "Router & Brain",
    department: "Operations",
    deptGroup: "operations",
  },
  {
    id: "architect",
    name: "Akbar",
    emoji: "🏗️",
    position: [5, 0, -6],
    color: COLORS.amber,
    role: "System Architecture",
    department: "Architecture",
    deptGroup: "architecture",
  },

  // ── ROW 2 (z = -2): Build / Build / Design ─────────────────────────────

  {
    id: "build",
    name: "Luke",
    emoji: "⚡",
    position: [-5, 0, -2],
    color: COLORS.emerald,
    role: "Implementation",
    department: "Build",
    deptGroup: "build",
  },
  {
    id: "macgyver",
    name: "MacGyver",
    emoji: "🔧",
    position: [0, 0, -2],
    color: COLORS.cyan,
    role: "DevTools & Utilities",
    department: "Build",
    deptGroup: "build",
  },
  {
    id: "design",
    name: "Leia",
    emoji: "🎨",
    position: [5, 0, -2],
    color: COLORS.pink,
    role: "Design & UX",
    department: "Design",
    deptGroup: "design",
  },

  // ── ROW 3 (z = 2): Foreman / PM Sync / QA ──────────────────────────────

  {
    id: "foreman",
    name: "R2",
    emoji: "🤖",
    position: [-5, 0, 2],
    color: COLORS.electric,
    role: "Project Planning & Decomposition",
    department: "Operations",
    deptGroup: "operations",
  },
  {
    id: "pm-sync",
    name: "OBWON",
    emoji: "🗂️",
    position: [0, 0, 2],
    color: COLORS.indigo,
    role: "PM Tool Sync",
    department: "Operations",
    deptGroup: "operations",
  },
  {
    id: "qa",
    name: "Han",
    emoji: "🛡️",
    position: [5, 0, 2],
    color: COLORS.red,
    role: "QA & Reliability",
    department: "QA",
    deptGroup: "qa",
  },

  // ── ROW 4 (z = 6): Reporting / Growth (near entrance) ──────────────────

  {
    id: "reporter",
    name: "Chewy",
    emoji: "📊",
    position: [-3, 0, 6],
    color: COLORS.warmGold,
    role: "Program Reporting",
    department: "Reporting",
    deptGroup: "reporting",
  },
  {
    id: "growth",
    name: "Lando",
    emoji: "📣",
    position: [3, 0, 6],
    color: COLORS.orange,
    role: "Growth & Content",
    department: "Growth",
    deptGroup: "growth",
  },
];

/** Map from department group to a descriptive label shown in the office UI */
export const DEPT_LABELS: Record<AgentConfig["deptGroup"], string> = {
  operations:   "⚙️ Operations",
  research:     "🔬 Research",
  architecture: "🏗️ Architecture",
  build:        "⚡ Build",
  design:       "🎨 Design",
  qa:           "🛡️ QA",
  growth:       "📣 Growth",
  reporting:    "📊 Reporting",
};

/** Cluster color per department (for room zone overlays) */
export const DEPT_COLORS: Record<AgentConfig["deptGroup"], string> = {
  operations:   COLORS.gold,
  research:     COLORS.violet,
  architecture: COLORS.amber,
  build:        COLORS.emerald,
  design:       COLORS.pink,
  qa:           COLORS.red,
  growth:       COLORS.orange,
  reporting:    COLORS.warmGold,
};

export type AgentStatus = "idle" | "working" | "thinking" | "error";

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  model?: string; // opus, sonnet, haiku
  tokensPerHour?: number;
  tasksInQueue?: number;
  uptime?: number; // days
}
