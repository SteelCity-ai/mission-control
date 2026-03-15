/**
 * Team Models API
 * GET /api/costs/team-models
 * 
 * Returns the current team model assignments
 */
import { NextRequest, NextResponse } from "next/server";

// Agent model assignments (what the team is actually using)
const TEAM_MODELS: Record<string, { id: string; name: string; emoji: string; model: string; inputRate: number; outputRate: number }> = {
  main: { 
    id: "main", 
    name: "Yoda", 
    emoji: "🧙", 
    model: "minimax/minimax-m2.5",
    inputRate: 0.25,
    outputRate: 1.10
  },
  build: { 
    id: "build", 
    name: "Luke", 
    emoji: "🔨", 
    model: "minimax/minimax-m2.5",
    inputRate: 0.25,
    outputRate: 1.10
  },
  research: { 
    id: "research", 
    name: "3CP0", 
    emoji: "🔍", 
    model: "google/gemini-2.5-flash",
    inputRate: 0.15,
    outputRate: 0.60
  },
  architect: { 
    id: "architect", 
    name: "Akbar", 
    emoji: "📐", 
    model: "google/gemini-2.5-pro",
    inputRate: 1.25,
    outputRate: 5.00
  },
  design: { 
    id: "design", 
    name: "Leia", 
    emoji: "🎨", 
    model: "google/gemini-2.5-flash",
    inputRate: 0.15,
    outputRate: 0.60
  },
  qa: { 
    id: "qa", 
    name: "Han", 
    emoji: "🎯", 
    model: "minimax/minimax-m2.5",
    inputRate: 0.25,
    outputRate: 1.10
  },
  growth: { 
    id: "growth", 
    name: "Lando", 
    emoji: "📈", 
    model: "google/gemini-2.5-flash",
    inputRate: 0.15,
    outputRate: 0.60
  },
  foreman: { 
    id: "foreman", 
    name: "R2", 
    emoji: "🤖", 
    model: "minimax/minimax-m2.5",
    inputRate: 0.25,
    outputRate: 1.10
  },
  reporter: { 
    id: "reporter", 
    name: "Chewy", 
    emoji: "📊", 
    model: "google/gemini-2.5-flash",
    inputRate: 0.15,
    outputRate: 0.60
  },
  macgyver: { 
    id: "macgyver", 
    name: "MacGyver", 
    emoji: "🛠️", 
    model: "google/gemini-2.5-flash",
    inputRate: 0.15,
    outputRate: 0.60
  },
};

export async function GET(request: NextRequest) {
  try {
    const agents = Object.values(TEAM_MODELS);
    
    return NextResponse.json({
      agents,
      defaultModel: "minimax/minimax-m2.5",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching team models:", error);
    return NextResponse.json(
      { error: "Failed to fetch team models" },
      { status: 500 }
    );
  }
}
