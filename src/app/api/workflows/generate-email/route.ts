import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TemplateVariable = {
  category?: string;
  path: string;
  label?: string;
};

type GenerateEmailRequestBody = {
  description?: string;
  tone?: string;
  variables?: TemplateVariable[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateEmailRequestBody;
    const description = (body.description || "").trim();

    if (!description) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      subject: "Email Template",
      html: "<p>Email generation disabled. Please create the email template manually.</p>"
    });
  } catch (error) {
    console.error("Error in generate-email", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 },
    );
  }
}
