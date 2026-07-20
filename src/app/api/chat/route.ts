import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages?: ChatMessage[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing messages array" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: "AI chat is currently disabled. Please try again later.",
      },
    });
  } catch (error) {
    console.error("Error in /api/chat", error);
    return NextResponse.json(
      { error: "Failed to generate chat response" },
      { status: 500 },
    );
  }
}
