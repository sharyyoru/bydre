"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bitcoin, ArrowRight, Shield, Zap, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCryptoPrices } from "./crypto-price-context"

const CRYPTO_BENEFITS = [
  { icon: Zap, label: "Fast Transactions", desc: "Close in days, not months" },
  { icon: Globe, label: "Global Access", desc: "Invest from anywhere" },
  { icon: Shield, label: "Secure & Private", desc: "Blockchain verified" },
]

export function HeroSection() {
  const { prices } = useCryptoPrices()
  const [btcAnim, setBtcAnim] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setBtcAnim(true)
      setTimeout(() => setBtcAnim(false), 500)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const btcUsd = prices ? Math.round(prices.btc / 3.67) : 95000

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(201, 169, 98, 0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(201, 169, 98, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px"
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Live BTC Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931A]/10 border border-[#F7931A]/30 rounded-full mb-8">
            <Bitcoin className={`h-4 w-4 text-[#F7931A] ${btcAnim ? "animate-pulse" : ""}`} />
            <span className="text-[#F7931A] text-sm font-medium">
              BTC ${btcUsd.toLocaleString()}
            </span>
            <span className="text-white/40 text-sm">• Live</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6">
            Buy Dubai Property
            <br />
            <span className="text-[#C9A962]">with Bitcoin</span>
          </h1>

          <p className="text-xl text-white/70 max-w-xl mb-8 leading-relaxed">
            Convert your crypto assets into premium Dubai real estate. 
            Fast, secure, and hassle-free property purchases with BTC, ETH, and USDT.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-12">
            <Link href="/drecrypto/buy">
              <Button size="lg" className="bg-[#C9A962] hover:bg-[#b8994d] text-black gap-2 h-14 px-8 text-base">
                Browse Properties
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/drecrypto/how-it-works">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 h-14 px-8 text-base"
              >
                How It Works
              </Button>
            </Link>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap gap-8">
            {CRYPTO_BENEFITS.map((benefit) => (
              <div key={benefit.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C9A962]/20 flex items-center justify-center">
                  <benefit.icon className="h-5 w-5 text-[#C9A962]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{benefit.label}</p>
                  <p className="text-white/50 text-xs">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 space-y-6 w-64">
            <div>
              <p className="text-white/50 text-sm">Properties Listed</p>
              <p className="text-3xl text-white font-light">500+</p>
            </div>
            <div className="border-t border-white/10 pt-6">
              <p className="text-white/50 text-sm">Crypto Accepted</p>
              <div className="flex gap-2 mt-2">
                <div className="px-2 py-1 bg-[#F7931A]/20 text-[#F7931A] text-xs font-medium rounded">BTC</div>
                <div className="px-2 py-1 bg-[#627EEA]/20 text-[#627EEA] text-xs font-medium rounded">ETH</div>
                <div className="px-2 py-1 bg-[#26A17B]/20 text-[#26A17B] text-xs font-medium rounded">USDT</div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6">
              <p className="text-white/50 text-sm">Starting From</p>
              <p className="text-2xl text-[#C9A962] font-light">1.5 BTC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  )
}
