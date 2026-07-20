import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { to, subject, html } = (await request.json()) as {
      to?: string;
      subject?: string;
      html?: string;
    };

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, id: "mock-email-id" });
  } catch (error) {
    console.error("Error in /api/emails/send", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
