import { NextRequest, NextResponse } from "next/server";

// POST - Generate Agora token for a channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel_id, uid } = body;

    if (!channel_id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }

    const userId = uid || Math.floor(Math.random() * 100000);
    const channelName = `ch${channel_id.replace(/-/g, "").substring(0, 12)}`;

    return NextResponse.json({
      appId: "mock-agora-app-id",
      channel: channelName,
      token: "mock-agora-token",
      uid: userId,
      userName: "User",
    });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
