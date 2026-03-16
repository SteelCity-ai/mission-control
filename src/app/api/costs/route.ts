import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getCostSummary, getBudgetStatus, getBudgetConfig } from "@/lib/cost-tracker";

const DEFAULT_BUDGET = 100.0;

/**
 * GET /api/costs/summary
 * 
 * Query params:
 * - period: today | week | month (default: month)
 * - agent: optional agent ID to filter by
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = (searchParams.get("period") as "today" | "week" | "month") || "month";
  const agent = searchParams.get("agent") || undefined;
  
  try {
    // Get cost summary from JSONL files
    const summary = getCostSummary(period, agent);
    
    // Get budget status
    const budgetStatus = getBudgetStatus();
    
    // Get today's and yesterday's costs for comparison
    const today = getCostSummary("today", agent);
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = yesterdayStart.toISOString().split("T")[0];
    const yesterdayStartStr = yesterdayStart.toISOString().split("T")[0];
    
    // Get last month for comparison
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthSummary = getCostSummary("month");
    
    // Calculate projection
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const avgDailySpend = daysElapsed > 0 ? budgetStatus.thisMonth / daysElapsed : 0;
    const projected = avgDailySpend * daysInMonth;
    
    return NextResponse.json({
      totalCost: summary.totalCost,
      today: today.totalCost,
      yesterday: 0, // Simplified - can calculate if needed
      thisMonth: budgetStatus.thisMonth,
      lastMonth: lastMonthSummary.totalCost,
      projected,
      budget: budgetStatus.budget,
      budgetRemaining: budgetStatus.budgetRemaining,
      budgetExceeded: budgetStatus.budgetExceeded,
      percentUsed: budgetStatus.percentUsed,
      byAgent: summary.byAgent.map((a) => ({
        agent: a.agentId,
        model: a.model,
        cost: a.cost,
        tokens: a.tokens,
      })),
      byDay: summary.byDay,
    });
  } catch (error) {
    console.error("Error fetching cost summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost summary" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/costs/summary
 * 
 * Update budget configuration
 * Body: { budget: number, alerts: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { budget, alerts } = body;
    
    // Validate budget
    if (budget !== undefined && (typeof budget !== "number" || budget <= 0)) {
      return NextResponse.json(
        { error: "Budget must be a positive number" },
        { status: 400 }
      );
    }
    
    // Save config
    const fs = require("fs");
    const path = require("path");
    const configPath = "/data/costs-config.json";
    
    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const config = {
      monthly: budget ?? DEFAULT_BUDGET,
      alerts: alerts ?? true,
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return NextResponse.json({
      success: true,
      ...config,
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}
