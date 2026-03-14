/**
 * Office 3D — Steel City Agent Configuration
 *
 * This file defines the visual layout of agents in the 3D office.
 * Updated for Steel City AI team (11 agents).
 *
 * Agent IDs correspond to workspace directory suffixes:
 *   id: "main"     → workspace/          (main agent - Yoda)
 *   id: "foreman"  → workspace-foreman/  (R2)
 *   etc.
 */

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  position: [number, number, number]; // x, y, z
  color: string;
  role: string;
  department: string;
}

// Steel City Agent Roster - 11 agents across 7 departments
export const AGENTS: AgentConfig[] = [
  // Operations Department (center)
  {
    id: "main",
    name: "Yoda",
    emoji: "🧙",
    position: [0, 0, 0], // Center — main desk
    color: "#FFB612", // Pittsburgh gold
    role: "Router",
    department: "Operations",
  },
  {
    id: "foreman",
    name: "R2",
    emoji: "🤖",
    position: [-2, 0, -4],
    color: "#C0C0C0", // Silver
    role: "Foreman",
    department: "Operations",
  },
  // Research Department
  {
    id: "research",
    name: "3CP0",
    emoji: "🔬",
    position: [-6, 0, -4],
    color: "#4A90D9", // Steel blue
    role: "Research",
    department: "Research",
  },
  // Architecture Department
  {
    id: "architect",
    name: "Akbar",
    emoji: "🏗️",
    position: [6, 0, -4],
    color: "#7B68EE", // Medium slate blue
    role: "Architecture",
    department: "Architecture",
  },
  // Build Department
  {
    id: "build",
    name: "Luke",
    emoji: "⚡",
    position: [-6, 0, 0],
    color: "#50C878", // Emerald green
    role: "Build",
    department: "Build",
  },
  {
    id: "macgyver",
    name: "MacGyver",
    emoji: "🔧",
    position: [2, 0, -4],
    color: "#DAA520", // Goldenrod
    role: "DevTools",
    department: "Build",
  },
  // Design Department
  {
    id: "design",
    name: "Leia",
    emoji: "🎨",
    position: [6, 0, 0],
    color: "#FF69B4", // Hot pink
    role: "Design",
    department: "Design",
  },
  // QA Department
  {
    id: "qa",
    name: "Han",
    emoji: "🛡️",
    position: [-6, 0, 4],
    color: "#FF6347", // Tomato red
    role: "QA",
    department: "QA",
  },
  // Growth Department
  {
    id: "growth",
    name: "Lando",
    emoji: "📣",
    position: [6, 0, 4],
    color: "#FFA500", // Orange
    role: "Growth",
    department: "Growth",
  },
  // Reporting Department
  {
    id: "reporter",
    name: "Chewy",
    emoji: "📊",
    position: [-2, 0, 6],
    color: "#8B4513", // Saddle brown
    role: "Reporting",
    department: "Reporting",
  },
  // PM Sync
  {
    id: "pm-sync",
    name: "OBWON",
    emoji: "🗂️",
    position: [2, 0, 6],
    color: "#20B2AA", // Light sea green
    role: "PM Sync",
    department: "Operations",
  },
];

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