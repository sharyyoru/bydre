import { ContentBrief, DistributionEntry } from "./types"

export interface FeedItem extends ContentBrief {
  distributions?: DistributionEntry[]
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Build an RSS 2.0-style XML feed of content briefs for external syndication workers.
 */
export function buildFeedXml(
  workspaceName: string,
  items: FeedItem[],
  selfUrl: string
): string {
  const now = new Date().toUTCString()
  const entries = items
    .map((item) => {
      const dist = item.distributions?.[0]
      const platformCopy = Object.entries(item.platform_copy || {})
        .map(
          ([platform, copy]) =>
            `<platformCopy platform="${escapeXml(platform)}">${escapeXml(
              String(copy ?? "")
            )}</platformCopy>`
        )
        .join("")
      return `    <item>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.hook || item.summary || "")}</description>
      <angle>${escapeXml(item.angle || "")}</angle>
      <targetArea>${escapeXml(item.target_area || "")}</targetArea>
      <keywords>${escapeXml((item.keywords || []).join(", "))}</keywords>
      <status>${escapeXml(item.status)}</status>
      <arbitrageScore>${item.arbitrage_score ?? ""}</arbitrageScore>
      <pubDate>${new Date(item.updated_at).toUTCString()}</pubDate>
      ${dist ? `<distributionStatus>${escapeXml(dist.status)}</distributionStatus>` : ""}
      ${dist?.scheduled_at ? `<scheduledAt>${escapeXml(dist.scheduled_at)}</scheduledAt>` : ""}
      ${dist?.external_id ? `<externalId>${escapeXml(dist.external_id)}</externalId>` : ""}
      ${dist?.external_url ? `<link>${escapeXml(dist.external_url)}</link>` : ""}
      ${platformCopy}
    </item>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:bydre="https://bydre.app/social-monitor">
  <channel>
    <title>${escapeXml(workspaceName)} — Social Monitor Feed</title>
    <link>${escapeXml(selfUrl)}</link>
    <description>AI-generated content briefs and distribution queue</description>
    <lastBuildDate>${now}</lastBuildDate>
${entries}
  </channel>
</rss>`
}

/**
 * Build the JSON equivalent of the syndication feed.
 */
export function buildFeedJson(workspaceName: string, items: FeedItem[]) {
  return {
    feed: `${workspaceName} — Social Monitor Feed`,
    generatedAt: new Date().toISOString(),
    count: items.length,
    items: items.map((item) => {
      const dist = item.distributions?.[0]
      return {
        id: item.id,
        title: item.title,
        hook: item.hook,
        angle: item.angle,
        summary: item.summary,
        targetArea: item.target_area,
        keywords: item.keywords,
        status: item.status,
        arbitrageScore: item.arbitrage_score,
        platformCopy: item.platform_copy,
        updatedAt: item.updated_at,
        distribution: dist
          ? {
              status: dist.status,
              scheduledAt: dist.scheduled_at,
              externalId: dist.external_id,
              externalUrl: dist.external_url,
              platform: dist.platform,
            }
          : null,
      }
    }),
  }
}
