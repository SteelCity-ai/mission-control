/**
 * Cost Seeding API
 * POST /api/costs/seed
 * 
 * Backfills historical cost data for testing
 */
import { NextRequest, NextResponse } from "next/server";
import { generateHistoricalData } from "../../../scripts/seed-costs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const daysBack = body.days || 14;
    
    // Generate historical data
    generateHistoricalData(daysBack);
    
    return NextResponse.json({
      success: true,
      message: `Seeded ${daysBack} days of historical cost data`,
    });
  } catch (error) {
    console.error("Error seeding costs:", error);
    return NextResponse.json(
      { error: "Failed to seed cost data" },
      { status: 500 }
    );
  }
}
