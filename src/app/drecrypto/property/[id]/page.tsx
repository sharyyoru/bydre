"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { 
  MapPin, Bed, Bath, Maximize, Calendar, Building2, 
  Bitcoin, ArrowLeft, Loader2, Phone, MessageCircle,
  Share2, Heart, TrendingUp, DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CryptoConverter, OfferForm, PropertyCard } from "@/components/drecrypto"
import { ImageGallery } from "@/components/drecrypto/image-gallery"
import { PriceChart } from "@/components/drecrypto/price-chart"
import { PaymentPlan } from "@/components/drecrypto/payment-plan"
import { LocationMap } from "@/components/drecrypto/location-map"
import { useCurrency } from "@/components/drecrypto/currency-context"

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
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "payment">("overview")
  const { currency, formatPrice: formatCryptoPrice, getCurrencyColor } = useCurrency()

  useEffect(() => {
    fetchProperty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const res = await fetch(`/api/drecrypto/properties?limit=8&location=${encodeURIComponent(location.split(",")[0])}`)
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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: property?.name,
        text: `Check out ${property?.name} - ${formatBtc(property?.priceBtc || 0)}`,
        url: window.location.href,
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
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
      {/* Breadcrumb & Actions */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link 
          href="/drecrypto/buy" 
          className="inline-flex items-center text-white/60 hover:text-[#C9A962] text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg border border-white/20 hover:bg-white/10 text-white"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg border border-white/20 hover:bg-white/10 text-white">
            <Heart className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <section className="container mx-auto px-4 mb-8">
        <ImageGallery images={property.images} propertyName={property.name} />
      </section>

      {/* Property Header */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Title & Location */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={property.type === "off-plan" ? "bg-purple-600" : "bg-green-600"}>
                {property.type === "off-plan" ? "Off-Plan" : "Ready"}
              </Badge>
              <Image src="/square.png" alt="DreCrypto" width={24} height={24} className="rounded-sm" />
            </div>
            <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-2">
              By {property.developer}
            </p>
            <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
              {property.name}
            </h1>
            <div className="flex items-center gap-2 text-white/60">
              <MapPin className="h-4 w-4" />
              <span>{property.location}</span>
            </div>
          </div>

          {/* Right: Price */}
          <div className="lg:text-right">
            <p className="text-white/50 text-sm mb-1">Price in Crypto</p>
            <div 
              className="flex items-center gap-2 text-3xl lg:text-4xl font-bold mb-1"
              style={{ color: getCurrencyColor() }}
            >
              {currency === "BTC" ? (
                <Bitcoin className="h-8 w-8" />
              ) : (
                <DollarSign className="h-8 w-8" />
              )}
              {formatCryptoPrice(property.priceBtc, property.priceUsdt)}
            </div>
            <p className="text-white/50 text-sm">AED {formatPrice(property.priceAed)}</p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
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
      </section>

      {/* Tab Navigation */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex gap-2 border-b border-white/10">
          {[
            { key: "overview", label: "Overview", icon: Building2 },
            { key: "analytics", label: "Price Analytics", icon: TrendingUp },
            { key: "payment", label: "Payment Plan", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? "border-[#C9A962] text-[#C9A962]"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === "overview" && (
              <>
                {/* Crypto Prices */}
                <div className="p-6 bg-gradient-to-r from-[#C9A962]/20 to-transparent border-l-4 border-[#C9A962] rounded-r-xl">
                  <p className="text-white/60 text-sm mb-3">Price in All Cryptocurrencies</p>
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
                </div>

                {/* Description */}
                {property.description && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-light text-white mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#C9A962]" />
                      About This Property
                    </h2>
                    <p className="text-white/70 leading-relaxed">{property.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {property.amenities.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-light text-white mb-4">Amenities & Features</h2>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="border-white/20 text-white/80 px-3 py-1">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Map */}
                <LocationMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  location={property.location}
                  propertyName={property.name}
                />

                {/* Converter */}
                <CryptoConverter defaultAed={property.priceAed} />
              </>
            )}

            {activeTab === "analytics" && (
              <PriceChart
                priceAed={property.priceAed}
                priceBtc={property.priceBtc}
                sqft={property.sqft}
                location={property.location}
                type={property.type}
              />
            )}

            {activeTab === "payment" && (
              <PaymentPlan
                priceAed={property.priceAed}
                priceBtc={property.priceBtc}
                handover={property.handover}
                type={property.type}
              />
            )}
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
                  <button className="w-full py-2 px-4 border border-white/20 rounded-md text-white hover:bg-white/10 flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" />
                    Call
                  </button>
                </a>
              </div>

              {/* Developer Card */}
              <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Developer</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#C9A962]/20 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-[#C9A962]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{property.developer}</p>
                    <p className="text-white/50 text-sm">Verified Developer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="border-t border-white/10 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-light text-white mb-8">Similar Properties in {property.location.split(",")[0]}</h2>
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
