"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { 
  MapPin, Bed, Bath, Maximize, Calendar, Building2, 
  ChevronLeft, ChevronRight, Bitcoin, ArrowLeft, Loader2,
  Phone, MessageCircle, Share2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CryptoConverter, OfferForm, PropertyCard } from "@/components/drecrypto"

interface Property {
  id: number
  name: string
  developer: string
  location: string
  type: "off-plan" | "ready"
  status: string | null
  priceAed: number
  priceAedMax?: number
  priceBtc: number
  priceEth: number
  priceUsdt: number
  beds: string
  baths: string
  sqft: string
  handover: string | null
  description: string | null
  images: string[]
  amenities: string[]
  latitude: number | null
  longitude: number | null
}

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { id } = use(params)
  const [property, setProperty] = useState<Property | null>(null)
  const [similarProperties, setSimilarProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    fetchProperty()
  }, [id])

  async function fetchProperty() {
    setLoading(true)
    try {
      const res = await fetch(`/api/drecrypto/properties?id=${id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.property) {
          setProperty(data.property)
          fetchSimilar(data.property.location)
        }
      }
    } catch (error) {
      console.error("Error fetching property:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSimilar(location: string) {
    try {
      const res = await fetch(`/api/drecrypto/properties?limit=4`)
      if (res.ok) {
        const data = await res.json()
        setSimilarProperties(
          (data.properties || []).filter((p: Property) => p.id !== parseInt(id)).slice(0, 4)
        )
      }
    } catch (error) {
      console.error("Error fetching similar:", error)
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat("en-AE").format(price)
  
  const formatBtc = (btc: number) => {
    if (btc < 1) return `${(btc * 1000).toFixed(2)} mBTC`
    return `${btc.toFixed(2)} BTC`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-28 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-[#C9A962] animate-spin" />
      </div>
    )
  }

  if (!property) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <Link 
          href="/drecrypto/buy" 
          className="inline-flex items-center text-white/60 hover:text-[#C9A962] text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Link>
      </div>

      {/* Gallery */}
      <section className="container mx-auto px-4 mb-8">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Image */}
          <div className="lg:col-span-2 relative h-[300px] lg:h-[500px] overflow-hidden border border-white/10">
            <Image
              src={property.images[activeImage] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"}
              alt={property.name}
              fill
              className="object-cover"
            />
            
            {/* Navigation */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((prev) => prev === 0 ? property.images.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => prev === property.images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className={property.type === "off-plan" ? "bg-purple-600" : "bg-green-600"}>
                {property.type === "off-plan" ? "Off-Plan" : "Ready"}
              </Badge>
              <Image src="/square.png" alt="DreCrypto" width={28} height={28} className="rounded-sm" />
            </div>

            {/* BTC Price Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <div className="flex items-center gap-3">
                <Bitcoin className="h-8 w-8 text-[#F7931A]" />
                <div>
                  <p className="text-white text-3xl font-light">{formatBtc(property.priceBtc)}</p>
                  <p className="text-white/60">≈ {formatPrice(property.priceUsdt)} USDT</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="hidden lg:flex flex-col gap-4">
            {property.images.slice(0, 3).map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`relative h-[156px] overflow-hidden border transition-all ${
                  activeImage === index ? "border-[#C9A962]" : "border-white/10 hover:border-white/30"
                }`}
              >
                <Image src={image} alt={`${property.name} ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-2">
                By {property.developer}
              </p>
              <h1 className="text-3xl lg:text-4xl font-light text-white mb-4">
                {property.name}
              </h1>
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="h-4 w-4" />
                <span>{property.location}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10">
              <div className="text-center">
                <Bed className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                <p className="text-white font-medium">{property.beds}</p>
                <p className="text-white/50 text-sm">Bedrooms</p>
              </div>
              <div className="text-center">
                <Bath className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                <p className="text-white font-medium">{property.baths}</p>
                <p className="text-white/50 text-sm">Bathrooms</p>
              </div>
              <div className="text-center">
                <Maximize className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                <p className="text-white font-medium">{property.sqft}</p>
                <p className="text-white/50 text-sm">Sq. Ft.</p>
              </div>
              <div className="text-center">
                <Calendar className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                <p className="text-white font-medium">{property.handover?.slice(0, 7) || "Ready"}</p>
                <p className="text-white/50 text-sm">Handover</p>
              </div>
            </div>

            {/* Crypto Prices */}
            <div className="p-6 bg-gradient-to-r from-[#C9A962]/20 to-transparent border-l-4 border-[#C9A962]">
              <p className="text-white/60 text-sm mb-3">Price in Cryptocurrency</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-light text-white flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-[#F7931A]" />
                    {formatBtc(property.priceBtc)}
                  </p>
                  <p className="text-white/50 text-sm">Bitcoin</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white">
                    {property.priceEth.toFixed(2)} ETH
                  </p>
                  <p className="text-white/50 text-sm">Ethereum</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white">
                    {formatPrice(property.priceUsdt)} USDT
                  </p>
                  <p className="text-white/50 text-sm">Tether</p>
                </div>
              </div>
              <p className="text-white/40 text-xs mt-3">AED {formatPrice(property.priceAed)}</p>
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-xl font-light text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#C9A962]" />
                  About This Property
                </h2>
                <p className="text-white/70 leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-light text-white mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline" className="border-white/20 text-white/80">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Converter */}
            <CryptoConverter defaultAed={property.priceAed} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-28">
              <OfferForm 
                propertyId={property.id} 
                propertyName={property.name}
                priceAed={property.priceAed}
              />

              {/* Quick Contact */}
              <div className="mt-6 flex gap-4">
                <a
                  href={`https://wa.me/+971527543243?text=Hi, I'm interested in ${property.name} (${formatBtc(property.priceBtc)})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
                <a href="tel:+971527543243" className="flex-1">
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="border-t border-white/10 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-light text-white mb-8">Similar Properties</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
