import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface InstagramPost {
  id: string
  caption: string
  media_url: string
  permalink: string
  timestamp: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  thumbnail_url?: string
}

interface CacheEntry {
  data: InstagramPost[]
  timestamp: number
}

let instagramCache: CacheEntry | null = null
const CACHE_DURATION = 3600000 // 1 hour

export async function GET() {
  try {
    // Check cache first
    const now = Date.now()
    if (instagramCache && (now - instagramCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({ 
        posts: instagramCache.data,
        cached: true 
      })
    }

    // Get Meta credentials from workspace
    const admin = createAdminClient()
    const { data: workspace } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", "drehomes")
      .single()

    if (!workspace?.id) {
      return NextResponse.json({ 
        posts: getFallbackPosts(),
        error: "Workspace not found" 
      })
    }

    const { data: credential } = await admin
      .from("integration_credentials")
      .select("secret, config")
      .eq("workspace_id", workspace.id)
      .eq("provider", "meta")
      .single()

    if (!credential?.secret) {
      return NextResponse.json({ 
        posts: getFallbackPosts(),
        error: "Meta credentials not configured" 
      })
    }

    // Get Instagram Business Account ID from config
    const instagramAccountId = (credential.config as Record<string, string>)?.instagram_account_id

    if (!instagramAccountId) {
      // Try to get account ID from the access token
      const accountsRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${credential.secret}`
      )
      
      if (!accountsRes.ok) {
        return NextResponse.json({ 
          posts: getFallbackPosts(),
          error: "Failed to fetch Instagram account" 
        })
      }

      return NextResponse.json({ 
        posts: getFallbackPosts(),
        error: "Instagram account not linked. Please configure instagram_account_id in Meta settings." 
      })
    }

    // Fetch Instagram posts
    const postsRes = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_url,permalink,timestamp,media_type,thumbnail_url&limit=8&access_token=${credential.secret}`
    )

    if (!postsRes.ok) {
      console.error("Instagram API error:", await postsRes.text())
      return NextResponse.json({ 
        posts: getFallbackPosts(),
        error: "Failed to fetch Instagram posts" 
      })
    }

    const postsData = await postsRes.json()
    const posts: InstagramPost[] = (postsData.data || []).map((post: Record<string, unknown>) => ({
      id: post.id as string,
      caption: ((post.caption as string) || "").slice(0, 150),
      media_url: (post.thumbnail_url || post.media_url) as string,
      permalink: post.permalink as string,
      timestamp: post.timestamp as string,
      media_type: post.media_type as string,
    }))

    // Update cache
    instagramCache = { data: posts, timestamp: now }

    return NextResponse.json({ posts, cached: false })
  } catch (error) {
    console.error("Instagram feed error:", error)
    return NextResponse.json({ 
      posts: getFallbackPosts(),
      error: "Internal server error" 
    })
  }
}

function getFallbackPosts(): InstagramPost[] {
  return [
    {
      id: "1",
      caption: "Luxury living in Dubai Marina 🏙️ Contact us for exclusive crypto-friendly deals!",
      media_url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      permalink: "https://www.instagram.com/drehomes_realestate/",
      timestamp: new Date().toISOString(),
      media_type: "IMAGE"
    },
    {
      id: "2",
      caption: "Palm Jumeirah waterfront living 🌴 Pay with Bitcoin, Ethereum or USDT",
      media_url: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
      permalink: "https://www.instagram.com/drehomes_realestate/",
      timestamp: new Date().toISOString(),
      media_type: "IMAGE"
    },
    {
      id: "3",
      caption: "Downtown Dubai skyline views 🌆 Off-plan investment opportunities available",
      media_url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
      permalink: "https://www.instagram.com/drehomes_realestate/",
      timestamp: new Date().toISOString(),
      media_type: "IMAGE"
    },
    {
      id: "4",
      caption: "Business Bay penthouse 🏢 Your crypto can become premium real estate",
      media_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      permalink: "https://www.instagram.com/drehomes_realestate/",
      timestamp: new Date().toISOString(),
      media_type: "IMAGE"
    },
    {
      id: "5",
      caption: "JBR beachfront apartments 🏖️ Live by the sea, pay with crypto",
      media_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      permalink: "https://www.instagram.com/drehomes_realestate/",
      timestamp: new Date().toISOString(),
      media_type: "IMAGE"
    },
    {
      id: "6",
      caption: "Emaar properties 🏗️ Top developers accepting cryptocurrency payments",
      media_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      permalink: "https://www.instagram.com/drehomes_realestate/",
      timestamp: new Date().toISOString(),
      media_type: "IMAGE"
    }
  ]
}
