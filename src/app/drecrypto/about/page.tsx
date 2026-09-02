"use client"

import Image from "next/image"
import Link from "next/link"
import { 
  Building2, Users, Globe, Shield, Award, 
  Bitcoin, ArrowRight, CheckCircle, MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

const STATS = [
  { value: "500+", label: "Properties Listed" },
  { value: "10+", label: "Years Experience" },
  { value: "50+", label: "Crypto Transactions" },
  { value: "100%", label: "Legal Compliance" },
]

const VALUES = [
  {
    icon: Shield,
    title: "Security First",
    description: "Every transaction is secured through licensed escrow services and blockchain verification."
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "We serve clients worldwide, breaking down barriers to Dubai property ownership."
  },
  {
    icon: Award,
    title: "RERA Licensed",
    description: "Fully licensed by the Real Estate Regulatory Agency of Dubai."
  },
  {
    icon: Users,
    title: "Expert Team",
    description: "Crypto-native agents who understand both real estate and blockchain."
  }
]

const DEVELOPERS = [
  "Emaar Properties",
  "DAMAC Properties", 
  "Sobha Realty",
  "Meraas",
  "Nakheel",
  "Dubai Properties",
  "Azizi Developments",
  "Binghatti"
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/header_logo_7708_dre-logo-b (1).png"
                alt="DreCrypto"
                width={140}
                height={50}
                className="h-10 w-auto"
              />
              <span className="text-[#C9A962] font-semibold text-xl">CRYPTO</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
              Dubai&apos;s Premier Crypto Real Estate Platform
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              DreCrypto is a division of DRE Homes, combining over a decade of Dubai real estate 
              expertise with cutting-edge cryptocurrency payment solutions. We help crypto holders 
              convert their digital assets into premium Dubai property.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/drecrypto/buy">
                <Button size="lg" className="bg-[#C9A962] hover:bg-[#b8994d] text-black gap-2">
                  Browse Properties
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="https://wa.me/+971527543243">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Contact Us
                </Button>
              </a>
            </div>
          </div>
          <div className="relative h-[400px] lg:h-[500px]">
            <Image
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
              alt="Dubai Real Estate"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-3">
                <Bitcoin className="h-8 w-8 text-[#F7931A]" />
                <div>
                  <p className="text-white font-medium">Crypto-Native</p>
                  <p className="text-white/60 text-sm">BTC • ETH • USDT Accepted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 p-6 text-center">
              <p className="text-4xl font-light text-[#C9A962] mb-2">{stat.value}</p>
              <p className="text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-white mb-8 text-center">Our Story</h2>
          <div className="space-y-6 text-white/70 leading-relaxed">
            <p>
              DRE Homes has been a trusted name in Dubai real estate since 2014, helping thousands 
              of investors find their perfect property. As cryptocurrency adoption accelerated globally, 
              we recognized a growing demand from crypto-native clients who wanted to diversify their 
              digital wealth into tangible assets.
            </p>
            <p>
              In 2024, we launched DreCrypto as a dedicated platform for cryptocurrency-powered real 
              estate transactions. Our team combines deep real estate expertise with blockchain knowledge, 
              enabling us to serve a new generation of global investors.
            </p>
            <p>
              Dubai&apos;s progressive stance on cryptocurrency, zero income tax, and world-class infrastructure 
              make it the perfect destination for crypto real estate investment. We&apos;re proud to bridge 
              the gap between digital assets and prime Dubai property.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 mb-20">
        <h2 className="text-3xl font-light text-white mb-12 text-center">Why Choose Us</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((value) => (
            <div key={value.title} className="bg-white/5 border border-white/10 p-6">
              <div className="w-12 h-12 mb-4 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-lg flex items-center justify-center">
                <value.icon className="h-6 w-6 text-[#C9A962]" />
              </div>
              <h3 className="text-white font-medium mb-2">{value.title}</h3>
              <p className="text-white/60 text-sm">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Developers We Work With */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-white mb-8 text-center">
            Trusted Developer Partners
          </h2>
          <p className="text-white/60 text-center mb-8">
            We work with Dubai&apos;s leading developers to bring you the best properties
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DEVELOPERS.map((developer) => (
              <div 
                key={developer}
                className="bg-white/5 border border-white/10 p-4 text-center text-white/80 hover:border-[#C9A962]/50 transition-colors"
              >
                {developer}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-white mb-8 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[
                "Ready properties and off-plan investments",
                "Live cryptocurrency pricing (BTC, ETH, USDT)",
                "Wallet verification for serious buyers",
                "Secure escrow and instant settlement",
                "Full legal and regulatory compliance"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[
                "Dubai Land Department registration",
                "Post-purchase property management",
                "Rental and resale assistance",
                "Golden Visa support for eligible purchases",
                "Dedicated crypto-native agents"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-[#C9A962]/20 to-[#C9A962]/5 border border-[#C9A962]/30 p-8 md:p-12 text-center">
          <Building2 className="h-12 w-12 text-[#C9A962] mx-auto mb-6" />
          <h2 className="text-2xl font-light text-white mb-4">
            Ready to Invest?
          </h2>
          <p className="text-white/60 mb-8">
            Let&apos;s discuss how you can convert your crypto into Dubai&apos;s finest real estate.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/+971527543243?text=Hi, I'm interested in learning more about DreCrypto">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Us
              </Button>
            </a>
            <Link href="/drecrypto/buy">
              <Button size="lg" className="bg-[#C9A962] hover:bg-[#b8994d] text-black gap-2">
                Browse Properties
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
