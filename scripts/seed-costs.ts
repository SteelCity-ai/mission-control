/**
 * Cost Seeding Script
 * Backfills historical cost data based on estimated agent usage
 * 
 * Usage: npx ts-node scripts/seed-costs.ts
 */

import fs from "fs";
import path from "path";

// Model rates per 1M tokens
const MODEL_RATES: Record<string, { input: number; output: number }> = {
  "minimax/minimax-m2.5": { input: 0.25, output: 1.10 },
  "openrouter/minimax/minimax-m2.5": { input: 0.25, output: 1.10 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-pro": { input: 1.25, output: 5.00 },
  "google/gemini-3.1-pro-preview": { input: 2.00, output: 12.00 },
  "anthropic/claude-opus-4.6": { input: 15.00, output: 75.00 },
  "anthropic/claude-sonnet-4.5": { input: 3.00, output: 15.00 },
  "anthropic/claude-haiku-3.5": { input: 0.80, output: 4.00 },
  "x-ai/grok-4-1-fast": { input: 2.00, output: 10.00 },
  default: { input: 1.00, output: 5.00 },
};

// Agent model assignments (what the team is actually using)
const TEAM_MODELS: Record<string, { model: string; agentName: string }> = {
  main: { model: "minimax/minimax-m2.5", agentName: "Yoda" },
  build: { model: "minimax/minimax-m2.5", agentName: "Luke" },
  research: { model: "google/gemini-2.5-flash", agentName: "3CP0" },
  architect: { model: "google/gemini-2.5-pro", agentName: "Akbar" },
  design: { model: "google/gemini-2.5-flash", agentName: "Leia" },
  qa: { model: "minimax/minimax-m2.5", agentName: "Han" },
  growth: { model: "google/gemini-2.5-flash", agentName: "Lando" },
  foreman: { model: "minimax/minimax-m2.5", agentName: "R2" },
  reporter: { model: "google/gemini-2.5-flash", agentName: "Chewy" },
};

// Estimated daily token usage per agent (rough estimates)
const DAILY_TOKEN_ESTIMATES: Record<string, { input: number; output: number }> = {
  main: { input: 50000, output: 20000 },       // Yoda - heavy user
  build: { input: 80000, output: 40000 },       // Luke - coding
  research: { input: 30000, output: 15000 },    // 3CP0 - research
  architect: { input: 20000, output: 10000 },  // Akbar - planning
  design: { input: 15000, output: 8000 },       // Leia - design specs
  qa: { input: 25000, output: 12000 },         // Han - testing
  growth: { input: 20000, output: 10000 },      // Lando - marketing
  foreman: { input: 30000, output: 15000 },     // R2 - orchestration
  reporter: { input: 10000, output: 5000 },     // Chewy - reporting
};

function getCostsDir(): string {
  const costsDir = path.join(process.cwd(), "data", "costs");
  if (!fs.existsSync(costsDir)) {
    fs.mkdirSync(costsDir, { recursive: true });
  }
  return costsDir;
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  let rate = MODEL_RATES[model];
  
  // Try without provider prefix
  if (!rate) {
    const shortModel = model.replace(/^(openrouter\/|anthropic\/|google\/|x-ai\/)/, "");
    rate = MODEL_RATES[shortModel];
  }
  
  // Try with openrouter prefix
  if (!rate && !model.startsWith("openrouter/")) {
    rate = MODEL_RATES[`openrouter/${model}`];
  }
  
  if (!rate) {
    rate = MODEL_RATES.default;
  }
  
  const inputCost = (inputTokens / 1_000_000) * rate.input;
  const outputCost = (outputTokens / 1_000_000) * rate.output;
  
  return inputCost + outputCost;
}

function generateHistoricalData(daysBack: number = 14): void {
  const costsDir = getCostsDir();
  const now = new Date();
  
  // Generate data for the past N days
  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    // Skip future dates
    if (date > now) continue;
    
    const entries: any[] = [];
    
    // Generate cost entries for each agent
    for (const [agentId, tokens] of Object.entries(DAILY_TOKEN_ESTIMATES)) {
      const teamModel = TEAM_MODELS[agentId];
      if (!teamModel) continue;
      
      // Add some variation to make it look realistic (±30%)
      const variation = () => 0.7 + Math.random() * 0.6;
      const inputTokens = Math.floor(tokens.input * variation());
      const outputTokens = Math.floor(tokens.output * variation());
      
      // Generate 3-5 entries per agent per day (simulate multiple sessions)
      const numSessions = 3 + Math.floor(Math.random() * 3);
      for (let s = 0; s < numSessions; s++) {
        const sessionInput = Math.floor(inputTokens / numSessions);
        const sessionOutput = Math.floor(outputTokens / numSessions);
        
        // Random timestamp during the day
        const hour = Math.floor(Math.random() * 12) + 8; // 8am-8pm
        const minute = Math.floor(Math.random() * 60);
        const timestamp = new Date(date);
        timestamp.setHours(hour, minute, 0, 0);
        
        const cost = calculateCost(teamModel.model, sessionInput, sessionOutput);
        
        entries.push({
          timestamp: timestamp.getTime(),
          agentId,
          model: teamModel.model,
          promptTokens: sessionInput,
          completionTokens: sessionOutput,
          totalTokens: sessionInput + sessionOutput,
          cost: Math.round(cost * 100) / 100,
        });
      }
    }
    
    // Sort by timestamp
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Write to file
    const filePath = path.join(costsDir, `${dateStr}.jsonl`);
    const content = entries.map(e => JSON.stringify(e)).join("\n");
    fs.writeFileSync(filePath, content);
    
    console.log(`✓ Seeded ${entries.length} cost entries for ${dateStr}`);
  }
  
  console.log(`\n✅ Historical cost data seeded successfully!`);
  console.log(`   Generated ~${daysBack} days of data`);
  console.log(`   Location: ${costsDir}`);
}

// Run if called directly
if (require.main === module) {
  const daysBack = parseInt(process.argv[2]) || 14;
  console.log(`Seeding ${daysBack} days of historical cost data...\n`);
  generateHistoricalData(daysBack);
}

export { generateHistoricalData, TEAM_MODELS, MODEL_RATES };
