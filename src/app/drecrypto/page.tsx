"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { PropertyCard, FAQAccordion, FAQ_DATA, CryptoConverter } from "@/components/drecrypto"
import { PropertySpotlight } from "@/components/drecrypto/property-spotlight"
import { InstagramFeed } from "@/components/drecrypto/instagram-feed"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Bitcoin, ArrowRight, Shield, Zap, Globe, Building2, 
  FileText, HandshakeIcon, CheckCircle, MessageCircle,
  Search, MapPin, TrendingUp, Users
} from "lucide-react"
import { useCurrency } from "@/components/drecrypto/currency-context"
import { useCryptoPrices } from "@/components/drecrypto/crypto-price-context"

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

const POPULAR_AREAS = [
  { name: "Dubai Marina", count: 245, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
  { name: "Downtown Dubai", count: 189, image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&q=80" },
  { name: "Palm Jumeirah", count: 156, image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&q=80" },
  { name: "Business Bay", count: 234, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80" },
]

const HOW_IT_WORKS = [
  {
    icon: Building2,
    title: "Browse Properties",
    description: "Explore our curated selection of Dubai properties with live crypto pricing."
  },
  {
    icon: FileText,
    title: "Submit Offer",
    description: "Make an offer in BTC, ETH, or USDT. Connect your wallet for verification."
  },
  {
    icon: HandshakeIcon,
    title: "Secure Transaction",
    description: "We handle conversion and escrow. You receive your property deed."
  }
]

const WHY_CRYPTO = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Close deals in days, not months. No international wire delays."
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Buy from anywhere in the world without banking restrictions."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Blockchain-verified transactions with full legal compliance."
  },
  {
    icon: CheckCircle,
    title: "No Hidden Fees",
    description: "Transparent pricing with minimal conversion costs."
  }
]

export default function DreCryptoHomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [totalProperties, setTotalProperties] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { currency, getCurrencyColor } = useCurrency()
  const { prices } = useCryptoPrices()

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/drecrypto/properties?limit=6")
        if (res.ok) {
          const data = await res.json()
          setProperties(data.properties || [])
          setTotalProperties(data.total || 0)
        }
      } catch (error) {
        console.error("Error fetching properties:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/drecrypto/buy?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      {/* Hero Section - Bayut/PropertyFinder Style */}
      <section className="relative min-h-[85vh] flex items-center pt-24">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
            alt="Dubai Skyline"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/60 to-[#0a0a0a]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#C9A962]/20 border border-[#C9A962]/40 rounded-full px-4 py-2 mb-6">
              <Bitcoin className="h-4 w-4 text-[#F7931A]" />
              <span className="text-white/90 text-sm">Pay with Bitcoin, Ethereum or USDT</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight">
              Buy Dubai Property<br />
              <span className="text-[#C9A962]">with Crypto</span>
            </h1>

            <p className="text-white/70 text-lg md:text-xl mb-8 max-w-2xl">
              {totalProperties.toLocaleString()}+ premium properties accepting cryptocurrency. 
              Fast, secure, and legally compliant transactions.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    type="text"
                    placeholder="Search by area, developer, or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 bg-transparent border-0 text-white placeholder:text-white/50 focus-visible:ring-0"
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg" 
                  className="h-14 px-8 bg-[#C9A962] hover:bg-[#b8994d] text-black font-medium"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/drecrypto/buy">
                <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                  <MapPin className="h-4 w-4 mr-2" />
                  All Properties
                </Button>
              </Link>
              <Link href="/drecrypto/offplan">
                <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                  <Building2 className="h-4 w-4 mr-2" />
                  Off-Plan
                </Button>
              </Link>
              <Link href="/drecrypto/how-it-works">
                <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                  <FileText className="h-4 w-4 mr-2" />
                  How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl">
            {[
              { label: "Properties", value: totalProperties.toLocaleString() + "+", icon: Building2 },
              { label: "BTC Price", value: prices ? `$${Math.round(prices.btc / 3.67).toLocaleString()}` : "...", icon: Bitcoin },
              { label: "Transactions", value: "500+", icon: TrendingUp },
              { label: "Happy Clients", value: "200+", icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <stat.icon className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Areas */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-2">Explore</p>
              <h2 className="text-2xl md:text-3xl font-light text-white">Popular Areas</h2>
            </div>
            <Link href="/drecrypto/buy" className="hidden md:block text-[#C9A962] hover:text-white text-sm">
              View All Areas →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {POPULAR_AREAS.map((area) => (
              <Link 
                key={area.name} 
                href={`/drecrypto/buy?location=${encodeURIComponent(area.name)}`}
                className="group relative h-48 rounded-xl overflow-hidden"
              >
                <Image
                  src={area.image}
                  alt={area.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-medium text-lg">{area.name}</h3>
                  <p className="text-white/60 text-sm">{area.count} properties</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Property Spotlight */}
      <section className="py-16 bg-[#050505]">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-2">Spotlight</p>
            <h2 className="text-2xl md:text-3xl font-light text-white">Featured Property</h2>
          </div>
          <PropertySpotlight />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-white">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="relative">
                {/* Connector Line */}
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-[#C9A962]/50 to-transparent" />
                )}
                
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-full flex items-center justify-center">
                    <step.icon className="h-10 w-10 text-[#C9A962]" />
                  </div>
                  <div className="w-8 h-8 mx-auto -mt-10 mb-4 bg-[#C9A962] rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-white text-xl font-medium mb-3">{step.title}</h3>
                  <p className="text-white/60">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/drecrypto/how-it-works">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-[#050505]">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-3">
                Featured Listings
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-white">
                Properties for Crypto
              </h2>
            </div>
            <Link href="/drecrypto/buy" className="hidden md:block">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 h-96 animate-pulse" />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} showContact />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-white/60">Loading properties from GenieMap...</p>
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link href="/drecrypto/buy">
              <Button className="bg-[#C9A962] hover:bg-[#b8994d] text-black">
                View All Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Crypto */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-3">
                Why Choose Crypto
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                The Future of Real Estate Investment
              </h2>
              <p className="text-white/70 text-lg mb-8 leading-relaxed">
                Dubai is one of the world&apos;s most crypto-friendly real estate markets. 
                Convert your digital assets into tangible property ownership with full legal 
                protection and government registration.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {WHY_CRYPTO.map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-[#C9A962]" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{benefit.title}</h4>
                      <p className="text-white/60 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <CryptoConverter defaultAed={2000000} />
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <InstagramFeed />

      {/* FAQ Preview */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[#C9A962] text-sm font-medium uppercase tracking-wider mb-3">
                Got Questions?
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <FAQAccordion items={FAQ_DATA.slice(0, 5)} showCategories={false} />

            <div className="text-center mt-8">
              <Link href="/drecrypto/faq">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View All FAQs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-[#C9A962]/20 to-[#C9A962]/5 border-y border-[#C9A962]/30">
        <div className="container mx-auto px-4 text-center">
          <Bitcoin className="h-16 w-16 text-[#C9A962] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Ready to Buy Property with Crypto?
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Our team of crypto-savvy real estate experts is ready to help you find 
            the perfect property and guide you through the entire process.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/+971527543243?text=Hi, I'm interested in buying property with crypto">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2 h-14 px-8">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Us
              </Button>
            </a>
            <Link href="/drecrypto/buy">
              <Button size="lg" className="bg-[#C9A962] hover:bg-[#b8994d] text-black gap-2 h-14 px-8">
                Browse Properties
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
