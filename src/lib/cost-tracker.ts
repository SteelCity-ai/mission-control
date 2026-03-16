/**
 * Cost Tracker - File-based cost storage using JSONL
 * Stores cost data in daily files: /data/costs/YYYY-MM-DD.jsonl
 */

import fs from "fs";
import path from "path";

export interface CostEntry {
  timestamp: number;
  agentId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface CostSummary {
  totalCost: number;
  byAgent: Array<{
    agentId: string;
    model: string;
    cost: number;
    tokens: number;
  }>;
  byDay: Array<{
    date: string;
    cost: number;
  }>;
}

// Load model rates from JSON file
function getModelRates(): Record<string, { input: number; output: number }> {
  try {
    return require("../data/model-rates.json");
  } catch {
    return { default: { input: 1.0, output: 5.0 } };
  }
}

/**
 * Calculate cost based on model and token counts
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = getModelRates();
  
  // Try exact match first
  let rate = rates[model];
  
  // Try without provider prefix
  if (!rate) {
    const shortModel = model.replace(/^(openrouter\/|anthropic\/|google\/|x-ai\/)/, "");
    rate = rates[shortModel];
  }
  
  // Try with openrouter prefix
  if (!rate && !model.startsWith("openrouter/")) {
    rate = rates[`openrouter/${model}`];
  }
  
  // Fall back to default
  if (!rate) {
    rate = rates.default || { input: 1.0, output: 5.0 };
  }
  
  const inputCost = (promptTokens / 1_000_000) * rate.input;
  const outputCost = (completionTokens / 1_000_000) * rate.output;
  
  return inputCost + outputCost;
}

/**
 * Get the costs directory path
 */
function getCostsDir(): string {
  // Use /data/costs for persistent storage (not in workspace)
  const costsDir = process.env.COSTS_DIR || "/data/costs";
  
  if (!fs.existsSync(costsDir)) {
    fs.mkdirSync(costsDir, { recursive: true });
  }
  
  return costsDir;
}

/**
 * Get the file path for a given date
 */
function getCostFilePath(date: string): string {
  return path.join(getCostsDir(), `${date}.jsonl`);
}

/**
 * Append a cost entry to the daily JSONL file
 */
export function trackCost(entry: Omit<CostEntry, "timestamp">): void {
  const now = Date.now();
  const date = new Date(now).toISOString().split("T")[0];
  const filePath = getCostFilePath(date);
  
  const fullEntry: CostEntry = {
    ...entry,
    timestamp: now,
  };
  
  const line = JSON.stringify(fullEntry);
  fs.appendFileSync(filePath, line + "\n");
}

/**
 * Read all cost entries for a given date
 */
export function getCostEntries(date: string): CostEntry[] {
  const filePath = getCostFilePath(date);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  
  return lines.map((line) => JSON.parse(line));
}

/**
 * Read cost entries for a date range
 */
export function getCostEntriesForRange(startDate: string, endDate: string): CostEntry[] {
  const entries: CostEntry[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    entries.push(...getCostEntries(dateStr));
  }
  
  return entries;
}

/**
 * Get cost summary for a period
 */
export function getCostSummary(
  period: "today" | "week" | "month",
  agentId?: string
): CostSummary {
  const now = new Date();
  let startDate: string;
  let endDate = now.toISOString().split("T")[0];
  
  if (period === "today") {
    startDate = endDate;
  } else if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = weekAgo.toISOString().split("T")[0];
  } else {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    startDate = monthAgo.toISOString().split("T")[0];
  }
  
  const entries = getCostEntriesForRange(startDate, endDate);
  
  // Filter by agent if specified
  const filteredEntries = agentId
    ? entries.filter((e) => e.agentId === agentId)
    : entries;
  
  // Calculate totals
  const totalCost = filteredEntries.reduce((sum, e) => sum + e.cost, 0);
  
  // Group by agent
  const byAgentMap = new Map<string, { agentId: string; model: string; cost: number; tokens: number }>();
  
  for (const entry of filteredEntries) {
    const key = entry.agentId;
    const existing = byAgentMap.get(key);
    
    if (existing) {
      existing.cost += entry.cost;
      existing.tokens += entry.totalTokens;
    } else {
      byAgentMap.set(key, {
        agentId: entry.agentId,
        model: entry.model,
        cost: entry.cost,
        tokens: entry.totalTokens,
      });
    }
  }
  
  const byAgent = Array.from(byAgentMap.values()).sort((a, b) => b.cost - a.cost);
  
  // Group by day
  const byDayMap = new Map<string, number>();
  
  for (const entry of filteredEntries) {
    const date = new Date(entry.timestamp).toISOString().split("T")[0];
    const existing = byDayMap.get(date) || 0;
    byDayMap.set(date, existing + entry.cost);
  }
  
  const byDay = Array.from(byDayMap.entries())
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalCost,
    byAgent,
    byDay,
  };
}

/**
 * Get budget configuration
 */
export function getBudgetConfig(): { monthly: number; alerts: boolean } {
  try {
    const configPath = "/data/costs-config.json";
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch {
    // Ignore errors, use defaults
  }
  
  return { monthly: 100, alerts: true };
}

/**
 * Get current month costs and budget status
 */
export function getBudgetStatus(): {
  thisMonth: number;
  budget: number;
  budgetRemaining: number;
  budgetExceeded: boolean;
  percentUsed: number;
} {
  const config = getBudgetConfig();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];
  
  const entries = getCostEntriesForRange(monthStart, today);
  const thisMonth = entries.reduce((sum, e) => sum + e.cost, 0);
  
  const budgetRemaining = Math.max(0, config.monthly - thisMonth);
  const budgetExceeded = thisMonth > config.monthly;
  const percentUsed = (thisMonth / config.monthly) * 100;
  
  return {
    thisMonth,
    budget: config.monthly,
    budgetRemaining,
    budgetExceeded,
    percentUsed,
  };
}
