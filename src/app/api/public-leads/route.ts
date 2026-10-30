import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Create admin client for public lead capture
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const record = rateLimitMap.get(ip);
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const supabase = createSessionClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json(
        { error: "Please sign in to view leads." },
        { status: 401, headers },
      );

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (memberError)
      return NextResponse.json(
        { error: "Unable to verify workspace access." },
        { status: 500, headers },
      );
    if (!member)
      return NextResponse.json(
        { error: "Workspace access is required." },
        { status: 403, headers },
      );

    const pageValue = Number(request.nextUrl.searchParams.get("page") || 1);
    const page =
      Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue <= 100000
        ? pageValue
        : 1;
    const pageSize = 25;
    const search = (request.nextUrl.searchParams.get("search") || "")
      .trim()
      .slice(0, 100);
    let query = supabase
      .from("public_leads")
      .select(
        "id, full_name, email, phone, country, interest, status, created_at",
        { count: "exact" },
      )
      .eq("lead_source", "landing_page");
    if (search)
      query = query.ilike(
        "full_name",
        `%${search.replace(/[\\%_]/g, "\\$&")}%`,
      );
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error)
      return NextResponse.json(
        { error: "Unable to load leads. Please try again." },
        { status: 500, headers },
      );
    return NextResponse.json(
      { leads: data || [], total: count || 0, page, pageSize },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load leads. Please try again." },
      { status: 500, headers },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (
      typeof body.full_name !== "string" ||
      body.full_name.trim().length < 2 ||
      body.full_name.length > 200
    ) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (
      typeof body.email !== "string" ||
      !body.email.includes("@") ||
      body.email.length > 320
    ) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }
    if (
      typeof body.phone !== "string" ||
      body.phone.length < 8 ||
      body.phone.length > 50
    ) {
      return NextResponse.json(
        { error: "Valid phone number is required" },
        { status: 400 },
      );
    }

    const bedrooms = body.bedrooms;
    if (
      bedrooms !== undefined &&
      bedrooms !== null &&
      bedrooms !== "" &&
      ![3, 4, 5, "3", "4", "5"].includes(bedrooms)
    ) {
      return NextResponse.json(
        { error: "Please select 3, 4, or 5 bedrooms, or no preference." },
        { status: 400 },
      );
    }
    if (
      body.interest != null &&
      (typeof body.interest !== "string" || body.interest.length > 200)
    ) {
      return NextResponse.json(
        { error: "Please select a valid interest." },
        { status: 400 },
      );
    }
    const interest =
      [body.interest?.trim(), bedrooms ? `${bedrooms} bedrooms` : ""]
        .filter(Boolean)
        .join(" · ") || null;

    // Insert lead into database
    const { data, error } = await getAdminClient()
      .from("public_leads")
      .insert({
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        country: body.country || "Not specified",
        interest,
        lead_source: body.lead_source || "website",
        ip_address: ip,
        user_agent: request.headers.get("user-agent") || "",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save lead. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
