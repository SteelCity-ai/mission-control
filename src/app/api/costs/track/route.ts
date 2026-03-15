import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { trackCost, calculateCost, getBudgetConfig } from "@/lib/cost-tracker";

/**
 * POST /api/costs/track
 * 
 * Track a cost entry from agent execution
 * Body: { agentId, model, promptTokens, completionTokens, totalTokens, cost? }
 * 
 * If cost is not provided, it will be calculated from model rates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, model, promptTokens, completionTokens, totalTokens, cost } = body;
    
    // Validate required fields
    if (!agentId || !model) {
      return NextResponse.json(
        { error: "agentId and model are required" },
        { status: 400 }
      );
    }
    
    // Calculate cost if not provided
    const finalCost = cost ?? calculateCost(
      model,
      promptTokens || 0,
      completionTokens || 0
    );
    
    // Track the cost
    trackCost({
      agentId,
      model,
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      totalTokens: totalTokens || (promptTokens || 0) + (completionTokens || 0),
      cost: finalCost,
    });
    
    // Get budget status to check if alert should be triggered
    const config = getBudgetConfig();
    
    return NextResponse.json({
      success: true,
      cost: finalCost,
      message: "Cost tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking cost:", error);
    return NextResponse.json(
      { error: "Failed to track cost" },
      { status: 500 }
    );
  }
}
