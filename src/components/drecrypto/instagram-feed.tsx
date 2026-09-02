"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Instagram, ExternalLink, Heart, MessageCircle, ChevronLeft, ChevronRight, Play } from "lucide-react"

interface InstagramPost {
  id: string
  caption: string
  media_url: string
  permalink: string
  timestamp: string
  media_type: string
  thumbnail_url?: string
}

export function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  // Separate reels and images
  const reels = posts.filter(p => p.media_type === "VIDEO")
  const images = posts.filter(p => p.media_type === "IMAGE" || p.media_type === "CAROUSEL_ALBUM")

  if (loading) {
    return (
      <section className="py-16 bg-[#050505]">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-48 aspect-[9/16] bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </section>
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

        {/* Reels Carousel (if any) */}
        {reels.length > 0 && (
          <div className="mb-8">
            <h3 className="text-white/60 text-sm uppercase tracking-wider mb-4">Latest Reels</h3>
            <div className="relative">
              {/* Scroll Buttons */}
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/90 -ml-5"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/90 -mr-5"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Reels Container */}
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {reels.map((post) => (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex-shrink-0 w-40 md:w-48 relative overflow-hidden rounded-xl border border-white/10 hover:border-[#C9A962]/50 transition-colors"
                  >
                    <div className="aspect-[9/16] relative">
                      <Image
                        src={post.thumbnail_url || post.media_url}
                        alt={post.caption || "Instagram reel"}
                        fill
                        className="object-cover"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <Play className="h-5 w-5 text-white fill-white ml-1" />
                        </div>
                      </div>
                      {/* Gradient for caption */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                      <p className="absolute bottom-3 left-3 right-3 text-white text-xs line-clamp-2">
                        {post.caption?.slice(0, 60) || "Watch now"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Posts Grid */}
        {images.length > 0 && (
          <div>
            <h3 className="text-white/60 text-sm uppercase tracking-wider mb-4">Recent Posts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {images.slice(0, 6).map((post) => (
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
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Fallback if no posts */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-white/60">Follow us on Instagram for the latest updates</p>
          </div>
        )}

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
