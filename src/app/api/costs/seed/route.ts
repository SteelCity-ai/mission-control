import { NextResponse } from "next/server";
import { trackCost } from "@/lib/cost-tracker";

const agents = [
  { id: "main", model: "openrouter/hunter-alpha", tokens: 50000 },
  { id: "foreman", model: "openrouter/minimax/minimax-m2.5", tokens: 80000 },
  { id: "research", model: "openrouter/minimax/minimax-m2.5", tokens: 120000 },
  { id: "architect", model: "openrouter/google/gemini-3.1-pro-preview", tokens: 60000 },
  { id: "build", model: "openrouter/minimax/minimax-m2.5", tokens: 200000 },
  { id: "design", model: "openrouter/google/gemini-3-flash-preview", tokens: 40000 },
  { id: "qa", model: "openrouter/hunter-alpha", tokens: 30000 },
  { id: "growth", model: "openrouter/minimax/minimax-m2.5", tokens: 100000 },
  { id: "reporter", model: "openrouter/healer-alpha", tokens: 20000 },
  { id: "pm-sync", model: "openrouter/minimax/minimax-m2.5", tokens: 15000 },
  { id: "macgyver", model: "openrouter/minimax/minimax-m2.5", tokens: 25000 },
];

export async function POST() {
  // Seed 14 days of data
  for (let d = 14; d >= 0; d--) {
    for (const agent of agents) {
      const variance = 0.5 + Math.random();
      const promptTokens = Math.round(agent.tokens * variance);
      const completionTokens = Math.round(promptTokens * 0.3);
      trackCost({ agentId: agent.id, model: agent.model, promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, cost: 0 });
    }
  }
  return NextResponse.json({ success: true });
}