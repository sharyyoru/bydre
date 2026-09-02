"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Bed, Maximize, Bitcoin, Calendar, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCurrency } from "./currency-context"

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

// Default fallback images by area/developer
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
]

function getPropertyImage(property: PropertyCardProps["property"]): string {
  // If property has valid images, use the first one
  if (property.images && property.images.length > 0 && property.images[0]) {
    return property.images[0]
  }
  // Otherwise return a consistent fallback based on property ID
  return FALLBACK_IMAGES[property.id % FALLBACK_IMAGES.length]
}

export function PropertyCard({ property, showContact }: PropertyCardProps) {
  const { currency, formatPrice: formatCryptoPrice, getCurrencyColor } = useCurrency()
  const formatAed = (price: number) => new Intl.NumberFormat("en-AE").format(price)
  const propertyImage = getPropertyImage(property)

  return (
    <Link href={`/drecrypto/property/${property.id}`}>
      <div className="group bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-all duration-300 overflow-hidden rounded-lg">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <Image
            src={propertyImage}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Watermark Logo */}
          <div className="absolute bottom-3 right-3">
            <Image
              src="/square.png"
              alt="DreCrypto"
              width={40}
              height={40}
              className="rounded-sm opacity-60"
            />
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge 
              className={`${
                property.type === "off-plan" 
                  ? "bg-purple-600/90 text-white" 
                  : "bg-green-600/90 text-white"
              } text-xs px-2 py-1`}
            >
              {property.type === "off-plan" ? "Off-Plan" : "Ready"}
            </Badge>
          </div>

          {/* Crypto Price Overlay */}
          <div className="absolute top-3 right-3">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white text-sm font-bold"
              style={{ backgroundColor: getCurrencyColor() }}
            >
              {currency === "BTC" ? (
                <Bitcoin className="h-4 w-4" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              {formatCryptoPrice(property.priceBtc, property.priceUsdt)}
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
              AED {formatAed(property.priceAed)}
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
