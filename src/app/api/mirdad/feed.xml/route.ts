import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: models, error } = await supabase
      .from("mirdad_models")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching models:", error)
      return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://drehomes.com"
    const now = new Date().toISOString()

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.mirdad.store/schema" version="1.0">
  <channel>
    <title>Mirdad Mechanical Models</title>
    <link>${baseUrl}/mirdad</link>
    <description>Premium mechanical model kits and 3D build instructions</description>
    <language>en-AE</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Mirdad Feed Generator v1.0</generator>
  </channel>
  <products>
${(models || [])
  .map(
    (model) => `    <product>
      <id>${model.id}</id>
      <slug>${escapeXml(model.slug)}</slug>
      <title>${escapeXml(model.title)}</title>
      <title_fr>${escapeXml(model.title_fr || model.title)}</title_fr>
      <description><![CDATA[${model.description || ""}]]></description>
      <description_fr><![CDATA[${model.description_fr || model.description || ""}]]></description_fr>
      <short_description>${escapeXml(model.short_description || "")}</short_description>
      <link>${baseUrl}/mirdad#${model.slug}</link>
      <image>${model.image_url?.startsWith("http") ? model.image_url : `${baseUrl}${model.image_url}`}</image>
      <price currency="AED">${model.price_aed}</price>
      <piece_count>${model.piece_count}</piece_count>
      <complexity>${model.complexity_level}</complexity>
      <category>${escapeXml(model.category)}</category>
      <category_fr>${escapeXml(model.category_fr || model.category)}</category_fr>
      <availability>${mapStockStatus(model.stock_status)}</availability>
      <stock_status>${model.stock_status}</stock_status>
      <is_featured>${model.is_featured}</is_featured>
      <created_at>${model.created_at}</created_at>
      <updated_at>${model.updated_at}</updated_at>
    </product>`
  )
  .join("\n")}
  </products>
</feed>`

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("Feed generation error:", error)
    return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 })
  }
}

function escapeXml(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function mapStockStatus(status: string): string {
  switch (status) {
    case "in_stock":
      return "in stock"
    case "low_stock":
      return "limited availability"
    case "out_of_stock":
      return "out of stock"
    case "preorder":
      return "preorder"
    default:
      return "in stock"
  }
}
