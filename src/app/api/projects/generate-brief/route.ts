import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GenerateBriefRequestBody = {
  companyName?: string;
  projectName?: string;
  targetAudience?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBriefRequestBody;
    const { projectName, targetAudience } = body;

    return NextResponse.json({
      brief: {
        executive_summary: `Project brief for ${projectName || "Untitled Project"}`,
        objectives: ["To be defined based on project requirements"],
        target_audience: {
          primary: targetAudience || "To be defined",
          secondary: "",
          demographics: "",
          psychographics: "",
        },
        scope: {
          deliverables: [],
          in_scope: [],
          out_of_scope: [],
        },
        key_messages: [],
        success_metrics: [],
        timeline_considerations: "",
        budget_considerations: "",
        stakeholders: [],
        constraints: [],
        inspiration: "Brief generation disabled - please fill in details manually",
      },
    });
  } catch (error) {
    console.error("Error in generate-brief:", error);
    return NextResponse.json(
      { error: "Failed to generate project brief" },
      { status: 500 },
    );
  }
}
