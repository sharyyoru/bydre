"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Bed, Maximize, ArrowRight, Bitcoin, DollarSign, Sparkles } from "lucide-react"
import { useCurrency } from "./currency-context"

interface Property {
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
}

export function PropertySpotlight() {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const { currency, formatPrice, getCurrencyColor } = useCurrency()

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/drecrypto/properties?limit=20")
        if (res.ok) {
          const data = await res.json()
          const properties = data.properties || []
          if (properties.length > 0) {
            // Pick a random property from top 20
            const randomIndex = Math.floor(Math.random() * Math.min(properties.length, 20))
            setProperty(properties[randomIndex])
          }
        }
      } catch (error) {
        console.error("Error fetching featured:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  if (loading || !property) {
    return (
      <div className="relative h-[500px] bg-white/5 animate-pulse rounded-2xl" />
    )
  }

  const formatAed = (price: number) => new Intl.NumberFormat("en-AE").format(price)
  
  // Get a valid image or fallback
  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
  ]
  const propertyImage = (property.images && property.images.length > 0 && property.images[0])
    ? property.images[0]
    : FALLBACK_IMAGES[property.id % FALLBACK_IMAGES.length]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] border border-white/10">
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Image Side */}
        <div className="relative h-[300px] lg:h-[500px]">
          <Image
            src={propertyImage}
            alt={property.name}
            fill
            className="object-cover"
            priority
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0a] lg:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent lg:hidden" />
          
          {/* Featured Badge */}
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 bg-[#C9A962] text-black px-3 py-1.5 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Featured Property
            </div>
          </div>

          {/* Watermark */}
          <div className="absolute bottom-4 right-4">
            <Image
              src="/square.png"
              alt="DreCrypto"
              width={50}
              height={50}
              className="opacity-60"
            />
          </div>
        </div>

        {/* Content Side */}
        <div className="p-6 lg:p-10 flex flex-col justify-center">
          {/* Developer */}
          <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-2">
            {property.developer}
          </p>

          {/* Name */}
          <h2 className="text-white text-2xl lg:text-3xl font-light mb-3">
            {property.name}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-2 text-white/60 mb-6">
            <MapPin className="h-4 w-4" />
            <span>{property.location}</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-white/40 text-sm mb-1">Price in Crypto</p>
            <div 
              className="inline-flex items-center gap-2 text-3xl lg:text-4xl font-bold"
              style={{ color: getCurrencyColor() }}
            >
              {currency === "BTC" ? (
                <Bitcoin className="h-8 w-8" />
              ) : (
                <DollarSign className="h-8 w-8" />
              )}
              {formatPrice(property.priceBtc, property.priceUsdt)}
            </div>
            <p className="text-white/50 text-sm mt-1">
              ≈ AED {formatAed(property.priceAed)}
            </p>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2 text-white/70">
              <Bed className="h-5 w-5 text-[#C9A962]" />
              <span>{property.beds}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Maximize className="h-5 w-5 text-[#C9A962]" />
              <span>{property.sqft} sqft</span>
            </div>
            {property.handover && (
              <div className="text-white/70">
                <span className="text-[#C9A962]">Handover:</span> {property.handover.slice(0, 7)}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            <Link href={`/drecrypto/property/${property.id}`}>
              <button className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-black bg-[#C9A962] hover:bg-[#b8994d] rounded-md transition-colors">
                View Property
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href={`https://wa.me/+971527543243?text=Hi, I'm interested in ${property.name}`}>
              <button className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-transparent border border-white/30 rounded-md hover:bg-white/10 transition-colors">
                Inquire Now
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
