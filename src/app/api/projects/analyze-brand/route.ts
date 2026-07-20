import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AnalyzeBrandRequestBody = {
  pdfText?: string;
  pdfUrl?: string;
  companyName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeBrandRequestBody;
    const { pdfUrl } = body;

    return NextResponse.json({
      brandGuidelines: {
        colors: {
          primary: [{ name: "Primary Blue", hex: "#2563EB", usage: "Main brand color" }],
          secondary: [{ name: "Secondary Purple", hex: "#7C3AED", usage: "Accents and highlights" }],
          accent: [{ name: "Accent Orange", hex: "#F97316", usage: "Call to actions" }],
          neutrals: [
            { name: "Dark Gray", hex: "#1F2937", usage: "Text" },
            { name: "Light Gray", hex: "#F3F4F6", usage: "Backgrounds" },
          ],
        },
        typography: {
          primary_font: { name: "Inter", weights: ["Regular", "Medium", "Bold"], usage: "All text" },
          secondary_font: null,
          special_fonts: [],
        },
        tone_of_voice: {
          personality: ["Professional", "Friendly", "Clear"],
          do: ["Be concise", "Use active voice", "Be helpful"],
          dont: ["Use jargon", "Be condescending"],
          sample_phrases: [],
        },
        logo_usage: {
          clear_space: "Maintain clear space equal to the height of the logo mark",
          minimum_size: "24px height minimum",
          dont: ["Stretch or distort", "Change colors"],
        },
        imagery_style: {
          description: "Clean, modern, professional",
          characteristics: ["High quality", "Well-lit", "Authentic"],
        },
        brand_values: ["Quality", "Innovation", "Trust"],
        tagline: "",
        additional_notes: "Brand analysis disabled - using default guidelines",
      },
      pdfUrl,
    });
  } catch (error) {
    console.error("Error in analyze-brand:", error);
    return NextResponse.json(
      { error: "Failed to analyze brand guidelines" },
      { status: 500 },
    );
  }
}
