import { NextRequest, NextResponse } from "next/server"
import { buildFeedXml } from "@/lib/social-monitor/feed"
import { resolveFeed } from "../_feed-data"

export async function GET(request: NextRequest) {
  const feed = await resolveFeed(request)
  if (!feed) {
    return NextResponse.json({ error: "Invalid or missing feed token" }, { status: 401 })
  }

  const selfUrl = request.nextUrl.href
  const xml = buildFeedXml(feed.workspaceName, feed.items, selfUrl)

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
