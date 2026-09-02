"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Instagram, ExternalLink, Heart, MessageCircle } from "lucide-react"

interface InstagramPost {
  id: string
  caption: string
  media_url: string
  permalink: string
  timestamp: string
  media_type: string
}

export function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/drecrypto/instagram")
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts || [])
        }
      } catch (error) {
        console.error("Error fetching Instagram:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <section className="py-16 bg-[#050505]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
              <Instagram className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-medium">@drehomes_realestate</h2>
              <p className="text-white/60 text-sm">Follow us on Instagram</p>
            </div>
          </div>
          <a
            href="https://www.instagram.com/drehomes_realestate/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-[#C9A962] hover:text-white transition-colors text-sm"
          >
            View Profile
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {posts.slice(0, 6).map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <Image
                src={post.media_url}
                alt={post.caption || "Instagram post"}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-white">
                  <Heart className="h-5 w-5 fill-white" />
                </div>
                <div className="flex items-center gap-1 text-white">
                  <MessageCircle className="h-5 w-5 fill-white" />
                </div>
              </div>

              {/* Video indicator */}
              {post.media_type === "VIDEO" && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </a>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="text-center mt-6 sm:hidden">
          <a
            href="https://www.instagram.com/drehomes_realestate/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#C9A962] text-sm"
          >
            View Instagram Profile
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
