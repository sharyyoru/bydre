"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Bed, Maximize, Bitcoin, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PropertyCardProps {
  property: {
    id: number
    name: string
    developer: string
    location: string
    type: "off-plan" | "ready"
    priceAed: number
    priceBtc: number
    priceUsdt: number
    beds: string
    sqft: string
    handover: string | null
    images: string[]
    status?: string | null
  }
  showContact?: boolean
}

export function PropertyCard({ property, showContact }: PropertyCardProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat("en-AE").format(price)
  
  const formatBtc = (btc: number) => {
    if (btc < 1) return `${(btc * 1000).toFixed(1)} mBTC`
    return `${btc.toFixed(2)} BTC`
  }

  return (
    <Link href={`/drecrypto/property/${property.id}`}>
      <div className="group bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={property.images[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Square Logo Badge */}
          <div className="absolute top-3 right-3">
            <Image
              src="/square.png"
              alt="DreCrypto"
              width={32}
              height={32}
              className="rounded-sm opacity-80"
            />
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge 
              className={`${
                property.type === "off-plan" 
                  ? "bg-purple-600/90 text-white" 
                  : "bg-green-600/90 text-white"
              } text-xs`}
            >
              {property.type === "off-plan" ? "Off-Plan" : "Ready"}
            </Badge>
          </div>

          {/* BTC Price Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-[#F7931A]" />
              <span className="text-white font-bold">{formatBtc(property.priceBtc)}</span>
              <span className="text-white/60 text-sm">≈ {formatPrice(property.priceUsdt)} USDT</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Developer */}
          <p className="text-[#C9A962] text-xs font-medium uppercase tracking-wider">
            {property.developer}
          </p>

          {/* Name */}
          <h3 className="text-white font-medium text-lg line-clamp-1 group-hover:text-[#C9A962] transition-colors">
            {property.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-white/60 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span>{property.location}</span>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <div className="flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5" />
              <span>{property.beds}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="h-3.5 w-3.5" />
              <span>{property.sqft} sqft</span>
            </div>
            {property.handover && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{property.handover.slice(0, 7)}</span>
              </div>
            )}
          </div>

          {/* AED Price */}
          <div className="pt-3 border-t border-white/10">
            <p className="text-white/40 text-xs">Starting from</p>
            <p className="text-white text-lg font-light">
              AED {formatPrice(property.priceAed)}
            </p>
          </div>

          {showContact && (
            <div className="pt-2">
              <button className="w-full py-2 bg-[#C9A962] hover:bg-[#b8994d] text-black text-sm font-medium transition-colors">
                Make Offer in Crypto
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
