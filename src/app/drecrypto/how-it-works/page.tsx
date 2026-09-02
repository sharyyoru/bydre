"use client"

import Link from "next/link"
import { 
  Search, FileText, Wallet, Shield, CheckCircle, 
  Building2, HandshakeIcon, Key, ArrowRight, Bitcoin,
  Globe, Zap, Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Browse Properties",
    description: "Explore our curated selection of Dubai properties. Use filters to find properties by price (in BTC), location, bedrooms, and type. All listings show live crypto prices.",
    color: "#C9A962"
  },
  {
    number: "02",
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "Optionally connect your crypto wallet (MetaMask, WalletConnect) to verify your holdings. This speeds up the process and shows you're a serious buyer.",
    color: "#627EEA"
  },
  {
    number: "03",
    icon: FileText,
    title: "Submit an Offer",
    description: "Found your dream property? Submit an offer in BTC, ETH, or USDT. Include your contact details and any special requests. Our team reviews within 24 hours.",
    color: "#26A17B"
  },
  {
    number: "04",
    icon: HandshakeIcon,
    title: "Negotiate & Agree",
    description: "Our crypto-savvy agents will negotiate on your behalf. Once terms are agreed, we prepare the Sales Purchase Agreement with all crypto payment details.",
    color: "#F7931A"
  },
  {
    number: "05",
    icon: Shield,
    title: "KYC & Due Diligence",
    description: "Complete identity verification (passport, proof of address, source of funds). We conduct property due diligence: title deed check, no liens, zoning compliance.",
    color: "#C9A962"
  },
  {
    number: "06",
    icon: Lock,
    title: "Secure Escrow",
    description: "Your crypto is held in secure escrow through our licensed partners. Funds are only released when all conditions are met. Smart contract options available.",
    color: "#627EEA"
  },
  {
    number: "07",
    icon: Bitcoin,
    title: "Crypto Conversion",
    description: "At closing, your crypto is converted to AED at the locked-in rate through our licensed exchange partners. Instant settlement minimizes volatility risk.",
    color: "#F7931A"
  },
  {
    number: "08",
    icon: Building2,
    title: "DLD Registration",
    description: "The property is registered with the Dubai Land Department in your name. You receive the official Title Deed and all ownership documentation.",
    color: "#26A17B"
  },
  {
    number: "09",
    icon: Key,
    title: "Welcome Home!",
    description: "Receive your keys and property documents. You're now a Dubai property owner! Our team remains available for any post-purchase support.",
    color: "#C9A962"
  }
]

const SECURITY_FEATURES = [
  {
    icon: Shield,
    title: "Licensed Escrow",
    description: "All funds held by regulated escrow partners"
  },
  {
    icon: Lock,
    title: "Secure Conversion",
    description: "Instant crypto-to-AED through licensed exchanges"
  },
  {
    icon: CheckCircle,
    title: "Government Registered",
    description: "All transactions recorded with Dubai Land Department"
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Buy from anywhere in the world without restrictions"
  }
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-full mb-6">
            <Zap className="h-4 w-4 text-[#C9A962]" />
            <span className="text-[#C9A962] text-sm font-medium">Simple Process</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
            How It Works
          </h1>
          <p className="text-white/60 text-lg">
            Your 9-step journey to owning Dubai real estate with cryptocurrency. 
            From browsing to keys in hand, we guide you every step of the way.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A962] via-[#627EEA] to-[#26A17B] hidden md:block" />

            <div className="space-y-8">
              {STEPS.map((step, index) => (
                <div key={step.number} className="relative flex gap-8">
                  {/* Icon */}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-2 bg-[#0a0a0a] z-10"
                    style={{ borderColor: step.color }}
                  >
                    <step.icon className="h-7 w-7" style={{ color: step.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <span 
                        className="text-sm font-bold px-2 py-0.5"
                        style={{ backgroundColor: `${step.color}20`, color: step.color }}
                      >
                        Step {step.number}
                      </span>
                    </div>
                    <h3 className="text-xl text-white font-medium mb-2">{step.title}</h3>
                    <p className="text-white/60 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-light text-white text-center mb-12">
            Security & Compliance
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY_FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white/5 border border-white/10 p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-full flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-[#C9A962]" />
                </div>
                <h3 className="text-white font-medium mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Summary */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#C9A962]/20 to-transparent border border-[#C9A962]/30 p-8">
          <h2 className="text-xl font-light text-white mb-6">Typical Timeline</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-light text-[#C9A962]">1-2</p>
              <p className="text-white/60 text-sm">Days to find property</p>
            </div>
            <div>
              <p className="text-3xl font-light text-[#C9A962]">2-3</p>
              <p className="text-white/60 text-sm">Days for KYC & due diligence</p>
            </div>
            <div>
              <p className="text-3xl font-light text-[#C9A962]">1-2</p>
              <p className="text-white/60 text-sm">Days for escrow & conversion</p>
            </div>
            <div>
              <p className="text-3xl font-light text-[#C9A962]">1</p>
              <p className="text-white/60 text-sm">Day for DLD registration</p>
            </div>
          </div>
          <p className="text-white/40 text-center text-sm mt-6">
            Total: As fast as 5-7 business days from offer to ownership
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-light text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/60 mb-8">
            Browse our properties and make your first crypto offer today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/drecrypto/buy">
              <Button size="lg" className="bg-[#C9A962] hover:bg-[#b8994d] text-black gap-2 h-14 px-8">
                Browse Properties
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/drecrypto/faq">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 px-8">
                View FAQ
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
