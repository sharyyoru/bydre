"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Bed, Bath, Maximize, Calendar, Phone } from "lucide-react"
import { Property } from "../data/properties"
import { Button } from "@/components/ui/button"

interface PropertyCardProps {
  property: Property
  showContact?: boolean
}

export function PropertyCard({ property, showContact = false }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`
    }
    return `${(price / 1000).toFixed(0)}K`
  }

  const priceDisplay = property.priceType === "yearly" 
    ? `AED ${formatPrice(property.priceFrom)}/year`
    : property.priceTo 
      ? `AED ${formatPrice(property.priceFrom)} - ${formatPrice(property.priceTo)}`
      : `AED ${formatPrice(property.priceFrom)}`

  return (
    <Link href={`/drenew/property/${property.slug}`} className="group block">
      <div className="relative border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500 bg-gradient-to-b from-white/5 to-transparent">
        {/* Image */}
        <div className="relative h-[220px] overflow-hidden">
          <Image
            src={property.images[0]}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badge */}
          {property.badge && (
            <div className="absolute top-4 left-4">
              <span className="bg-[#C9A962] text-black text-xs font-medium px-3 py-1.5">
                {property.badge}
              </span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-4 right-4">
            <span className="bg-black/60 backdrop-blur text-white text-xs px-2 py-1 uppercase tracking-wider">
              {property.type === "off-plan" ? "Off-Plan" : property.type === "rental" ? "Rent" : "Buy"}
            </span>
          </div>

          {/* Price on Image */}
          <div className="absolute bottom-4 left-4">
            <p className="text-white font-semibold text-lg">{priceDisplay}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Developer */}
          <p className="text-[#C9A962] text-xs uppercase tracking-wider mb-2">
            By {property.developer}
          </p>

          {/* Name */}
          <h3 className="text-lg font-light text-white group-hover:text-[#C9A962] transition-colors line-clamp-1">
            {property.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 mt-2 text-white/50 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span>{property.location}</span>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Bed className="h-4 w-4" />
              <span>{property.beds}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Bath className="h-4 w-4" />
              <span>{property.baths}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Maximize className="h-4 w-4" />
              <span>{property.sqft} sqft</span>
            </div>
          </div>

          {/* Handover */}
          {property.handover && property.type !== "rental" && (
            <div className="flex items-center gap-1.5 mt-3 text-white/40 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>Handover: {property.handover}</span>
            </div>
          )}

          {/* Contact Button */}
          {showContact && (
            <Button
              variant="outline"
              className="w-full mt-4 border-white/20 text-white hover:bg-white/10 hover:border-[#C9A962] rounded-none text-sm"
              onClick={(e) => {
                e.preventDefault()
                window.open(`https://wa.me/+971527543243?text=Hi, I'm interested in ${property.name}`, "_blank")
              }}
            >
              <Phone className="h-4 w-4 mr-2" />
              Inquire Now
            </Button>
          )}
        </div>

        {/* Hover Line */}
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C9A962] group-hover:w-full transition-all duration-500" />
      </div>
    </Link>
  )
}
