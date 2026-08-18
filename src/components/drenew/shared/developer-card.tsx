"use client"

import Link from "next/link"
import { Building2, ArrowRight, Calendar } from "lucide-react"
import { Developer } from "../data/developers"

interface DeveloperCardProps {
  developer: Developer
}

export function DeveloperCard({ developer }: DeveloperCardProps) {
  return (
    <Link href={`/drenew/developer/${developer.slug}`} className="group block">
      <div className="relative border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500 bg-gradient-to-b from-white/5 to-transparent p-6">
        {/* Logo */}
        <div className="w-16 h-16 border border-[#C9A962]/50 flex items-center justify-center mb-6 group-hover:border-[#C9A962] group-hover:bg-[#C9A962]/10 transition-all">
          <span className="text-[#C9A962] text-2xl font-light">{developer.logo}</span>
        </div>

        {/* Name */}
        <h3 className="text-xl font-light text-white group-hover:text-[#C9A962] transition-colors">
          {developer.name}
        </h3>

        {/* Description */}
        <p className="text-white/50 text-sm mt-2 line-clamp-2">
          {developer.shortDescription}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-white/60 text-sm">
            <Building2 className="h-4 w-4 text-[#C9A962]" />
            <span>{developer.projectCount} Projects</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60 text-sm">
            <Calendar className="h-4 w-4 text-[#C9A962]" />
            <span>Est. {developer.establishedYear}</span>
          </div>
        </div>

        {/* Featured Badge */}
        {developer.featured && (
          <div className="absolute top-4 right-4">
            <span className="bg-[#C9A962]/20 text-[#C9A962] text-xs px-2 py-1 border border-[#C9A962]/30">
              Featured
            </span>
          </div>
        )}

        {/* View Link */}
        <div className="flex items-center gap-1 mt-6 text-white/50 group-hover:text-[#C9A962] transition-colors text-sm">
          View Projects
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Hover Line */}
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C9A962] group-hover:w-full transition-all duration-500" />
      </div>
    </Link>
  )
}
