"use client"

import Image from "next/image"
import Link from "next/link"
import { Home, ArrowRight } from "lucide-react"
import { Community } from "../data/communities"

interface CommunityCardProps {
  community: Community
  size?: "default" | "large"
}

export function CommunityCard({ community, size = "default" }: CommunityCardProps) {
  const isLarge = size === "large"

  return (
    <Link href={`/drenew/community/${community.slug}`} className="group block">
      <div className="relative border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500 overflow-hidden">
        {/* Image */}
        <div className={`relative ${isLarge ? "h-[320px]" : "h-[240px]"} overflow-hidden`}>
          <Image
            src={community.image}
            alt={community.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            {/* Featured Badge */}
            {community.featured && (
              <span className="absolute top-4 left-4 bg-[#C9A962] text-black text-xs font-medium px-3 py-1">
                Featured
              </span>
            )}

            {/* Name */}
            <h3 className={`${isLarge ? "text-2xl" : "text-xl"} font-light text-white group-hover:text-[#C9A962] transition-colors`}>
              {community.name}
            </h3>

            {/* Short Description */}
            <p className="text-white/60 text-sm mt-2 line-clamp-2">
              {community.shortDescription}
            </p>

            {/* Property Count */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-[#C9A962]">
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium">{community.propertyCount} Properties</span>
              </div>
              
              <div className="flex items-center gap-1 text-white/50 group-hover:text-[#C9A962] transition-colors text-sm">
                Explore
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Hover Line */}
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C9A962] group-hover:w-full transition-all duration-500" />
      </div>
    </Link>
  )
}
