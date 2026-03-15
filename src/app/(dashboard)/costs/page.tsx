"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar, PieChart, Bell } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CostData {
  totalCost: number;
  today: number;
  yesterday: number;
  thisMonth: number;
  lastMonth: number;
  projected: number;
  budget: number;
  budgetRemaining: number;
  budgetExceeded: boolean;
  percentUsed: number;
  byAgent: Array<{ agent: string; model: string; cost: number; tokens: number }>;
  byDay: Array<{ date: string; cost: number }>;
}

interface TeamModel {
  id: string;
  name: string;
  emoji: string;
  model: string;
  inputRate: number;
  outputRate: number;
}

const MODEL_PRICES = {
  "minimax-m2.5": { input: 0.30, output: 1.10 },
  "gemini-3.1-pro-preview": { input: 2.00, output: 12.00 },
  "gemini-3-flash-preview": { input: 0.50, output: 3.00 },
  "claude-opus-4.6": { input: 15.00, output: 75.00 },
  "claude-sonnet-4.5": { input: 3.00, output: 15.00 },
  "claude-haiku-3.5": { input: 0.80, output: 4.00 },
  "gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "gemini-2.5-pro": { input: 1.25, output: 5.00 },
};

export default function CostsPage() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [teamModels, setTeamModels] = useState<TeamModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("month");
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showLogCostModal, setShowLogCostModal] = useState(false);
  const [newBudget, setNewBudget] = useState(100);
  
  // Manual cost log form state
  const [logForm, setLogForm] = useState({
    agentId: "build",
    model: "minimax/minimax-m2.5",
    promptTokens: "",
    completionTokens: "",
    notes: "",
  });

  useEffect(() => {
    fetchCostData();
    const interval = setInterval(fetchCostData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchCostData = async () => {
    try {
      const res = await fetch(`/api/costs/summary?period=${timeframe}`);
      if (res.ok) {
        const data = await res.json();
        setCostData(data);
        setNewBudget(data.budget || 100);
      }
    } catch (error) {
      console.error("Failed to fetch cost data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetUpdate = async () => {
    try {
      const res = await fetch("/api/costs/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: newBudget, alerts: true }),
      });
      if (res.ok) {
        fetchCostData();
        setShowBudgetModal(false);
      }
    } catch (error) {
      console.error("Failed to update budget:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "var(--accent)" }}></div>
          <p style={{ color: "var(--text-secondary)" }}>Loading cost data...</p>
        </div>
      </div>
    );
  }

  if (!costData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Failed to load cost data</p>
          <button
            onClick={fetchCostData}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const budgetPercent = costData.percentUsed || ((costData.thisMonth / costData.budget) * 100);
  const budgetColor = budgetPercent < 60 ? "var(--success)" : budgetPercent < 85 ? "var(--warning)" : "var(--error)";
  const todayChange = costData.yesterday > 0 ? ((costData.today - costData.yesterday) / costData.yesterday) * 100 : 0;
  const monthChange = costData.lastMonth > 0 ? ((costData.thisMonth - costData.lastMonth) / costData.lastMonth) * 100 : 0;
  const showBudgetWarning = budgetPercent > 80;

  return (
    <div className="space-y-6">
      {/* Budget Warning Banner */}
      {showBudgetWarning && (
        <div
          className="p-4 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: budgetPercent >= 100 ? "rgba(255, 59, 48, 0.1)" : "rgba(255, 149, 0, 0.1)",
            border: `1px solid ${budgetPercent >= 100 ? "var(--error)" : "var(--warning)"}`,
          }}
        >
          <AlertTriangle
            className="w-5 h-5 flex-shrink-0"
            style={{ color: budgetPercent >= 100 ? "var(--error)" : "var(--warning)" }}
          />
          <div className="flex-1">
            <span
              className="font-medium"
              style={{ color: budgetPercent >= 100 ? "var(--error)" : "var(--warning)" }}
            >
              {budgetPercent >= 100
                ? "Budget exceeded!"
                : `Budget warning: ${budgetPercent.toFixed(0)}% used`}
            </span>
            <span style={{ color: "var(--text-secondary)" }} className="ml-2">
              {budgetPercent >= 100
                ? `You've spent $${costData.thisMonth.toFixed(2)} of $${costData.budget.toFixed(2)} this month`
                : `${(budgetPercent).toFixed(0)}% of your $${costData.budget.toFixed(2)} monthly budget used`}
            </span>
          </div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-3 py-1 rounded text-sm"
            style={{
              backgroundColor: budgetPercent >= 100 ? "var(--error)" : "var(--warning)",
              color: "white",
            }}
          >
            Adjust Budget
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Costs & Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Real cost tracking from OpenRouter API
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          {(["today", "week", "month"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: timeframe === tf ? "var(--accent)" : "transparent",
                color: timeframe === tf ? "white" : "var(--text-secondary)",
              }}
            >
              {tf === "today" ? "Today" : tf === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Today</span>
            {todayChange !== 0 && !isNaN(todayChange) && (
              <div className="flex items-center gap-1">
                {todayChange > 0 ? (
                  <TrendingUp className="w-3 h-3" style={{ color: "var(--error)" }} />
                ) : (
                  <TrendingDown className="w-3 h-3" style={{ color: "var(--success)" }} />
                )}
                <span
                  className="text-xs font-medium"
                  style={{ color: todayChange > 0 ? "var(--error)" : "var(--success)" }}
                >
                  {Math.abs(todayChange).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            ${costData.today.toFixed(2)}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {costData.yesterday > 0 ? `vs $${costData.yesterday.toFixed(2)} yesterday` : "No data for yesterday"}
          </p>
        </div>

        {/* This Month */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>This Month</span>
            {monthChange !== 0 && !isNaN(monthChange) && (
              <div className="flex items-center gap-1">
                {monthChange > 0 ? (
                  <TrendingUp className="w-3 h-3" style={{ color: "var(--error)" }} />
                ) : (
                  <TrendingDown className="w-3 h-3" style={{ color: "var(--success)" }} />
                )}
                <span
                  className="text-xs font-medium"
                  style={{ color: monthChange > 0 ? "var(--error)" : "var(--success)" }}
                >
                  {Math.abs(monthChange).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            ${costData.thisMonth.toFixed(2)}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            vs ${costData.lastMonth.toFixed(2)} last month
          </p>
        </div>

        {/* Projected */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Projected (EOM)</span>
          </div>
          <div className="text-3xl font-bold" style={{ color: "var(--warning)" }}>
            ${costData.projected.toFixed(2)}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Based on current pace
          </p>
        </div>

        {/* Budget */}
        <div
          className="p-6 rounded-xl cursor-pointer"
          style={{ backgroundColor: "var(--card)", border: `1px solid ${showBudgetWarning ? budgetColor : "var(--border)"}` }}
          onClick={() => setShowBudgetModal(true)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Budget</span>
            {showBudgetWarning && (
              <Bell className="w-4 h-4" style={{ color: budgetColor }} />
            )}
          </div>
          <div className="text-3xl font-bold" style={{ color: budgetColor }}>
            {budgetPercent.toFixed(0)}%
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--card-elevated)" }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${Math.min(budgetPercent, 100)}%`, backgroundColor: budgetColor }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            ${costData.thisMonth.toFixed(2)} / ${costData.budget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Daily Cost Trend
          </h3>
          {costData.byDay && costData.byDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costData.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="var(--accent)" strokeWidth={2} name="Cost ($)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
              No cost data yet. Track costs via API to see trends.
            </div>
          )}
        </div>

        {/* Cost by Agent */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Cost by Agent
          </h3>
          {costData.byAgent && costData.byAgent.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData.byAgent}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="agent" stroke="var(--text-muted)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="cost" fill="var(--accent)" name="Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
              No agent cost data yet.
            </div>
          )}
        </div>
      </div>

      {/* Model Pricing Table */}
      <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Model Pricing (per 1M tokens)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Model</th>
                <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Input ($/M)</th>
                <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Output ($/M)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(MODEL_PRICES).map(([model, prices]) => (
                <tr key={model} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-3 px-4">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{model}</span>
                  </td>
                  <td className="py-3 px-4 text-right" style={{ color: "var(--text-primary)" }}>${prices.input.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right" style={{ color: "var(--text-primary)" }}>${prices.output.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed table by agent */}
      <div className="p-6 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Detailed Breakdown by Agent
        </h3>
        {costData.byAgent && costData.byAgent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Agent</th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Model</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Tokens</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {costData.byAgent.map((agent) => {
                  const percent = costData.totalCost > 0 ? (agent.cost / costData.totalCost) * 100 : 0;
                  return (
                    <tr key={agent.agent} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-3 px-4">
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{agent.agent}</span>
                      </td>
                      <td className="py-3 px-4" style={{ color: "var(--text-secondary)" }}>
                        {agent.model}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                        {agent.tokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: "var(--text-primary)" }}>
                        ${agent.cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right" style={{ color: "var(--text-secondary)" }}>
                        {percent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
            No cost data recorded yet. Use the /api/costs/track endpoint to log costs from your agents.
          </p>
        )}
      </div>

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="p-6 rounded-xl max-w-md w-full mx-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Set Monthly Budget
            </h3>
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                Monthly Budget (USD)
              </label>
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: "var(--background)", 
                  borderColor: "var(--border)",
                  color: "var(--text-primary)"
                }}
                min="0"
                step="10"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: "var(--card-elevated)", 
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBudgetUpdate}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: "var(--accent)", 
                  color: "white"
                }}
              >
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
