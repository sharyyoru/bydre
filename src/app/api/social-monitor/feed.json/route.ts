import { NextRequest, NextResponse } from "next/server"
import { buildFeedJson } from "@/lib/social-monitor/feed"
import { resolveFeed } from "../_feed-data"

export async function GET(request: NextRequest) {
  const feed = await resolveFeed(request)
  if (!feed) {
    return NextResponse.json({ error: "Invalid or missing feed token" }, { status: 401 })
  }

  const json = buildFeedJson(feed.workspaceName, feed.items)
  return NextResponse.json(json, { headers: { "Cache-Control": "no-store" } })
}
