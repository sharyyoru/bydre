import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId: string;
      type: "note" | "task_comment" | "workflow" | "social_workflow";
      body: string;
    };

    const { userId, type, body: msgBody } = body;

    if (!userId || !msgBody) {
      return NextResponse.json({ error: "Missing userId or body" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in /api/notifications/email:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
