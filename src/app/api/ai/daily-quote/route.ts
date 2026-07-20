import { NextRequest, NextResponse } from "next/server";

// GET - Return daily quote
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Return a motivational quote
    return NextResponse.json({
      quote: "Every day is a fresh opportunity to create meaningful impact. Start strong, stay focused, and finish proud.",
    });
  } catch (err) {
    console.error("Error fetching daily quote:", err);
    return NextResponse.json({
      quote: "Every accomplishment starts with the decision to try. Make today count!",
    });
  }
}
