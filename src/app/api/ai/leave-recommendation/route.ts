import { NextRequest, NextResponse } from "next/server";

// GET - Get leave recommendation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    return NextResponse.json({
      recommendation: "Your workload appears manageable. Consider scheduling leave during quieter periods for maximum relaxation.",
      workloadLevel: "medium",
      pendingTaskCount: 0,
      upcomingEventsCount: 0,
      annualLeaveRemaining: 30,
    });
  } catch (err) {
    console.error("Error generating leave recommendation:", err);
    return NextResponse.json({
      recommendation: "Your workload appears manageable. Consider scheduling leave during quieter periods for maximum relaxation.",
      workloadLevel: "medium",
      pendingTaskCount: 0,
      upcomingEventsCount: 0,
      annualLeaveRemaining: 30,
    });
  }
}
