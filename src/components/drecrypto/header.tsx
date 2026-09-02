"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Bitcoin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCryptoPrices } from "./crypto-price-context"

const NAV_LINKS = [
  { label: "Buy", href: "/drecrypto/buy" },
  { label: "Off-Plan", href: "/drecrypto/offplan" },
  { label: "How It Works", href: "/drecrypto/how-it-works" },
  { label: "FAQ", href: "/drecrypto/faq" },
  { label: "About", href: "/drecrypto/about" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { prices, loading } = useCryptoPrices()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const formatBtcPrice = () => {
    if (loading || !prices) return "Loading..."
    // Convert AED to USD (approximate)
    const btcUsd = Math.round(prices.btc / 3.67)
    return `$${btcUsd.toLocaleString()}`
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      {/* BTC Ticker Bar */}
      <div className="bg-[#C9A962]/10 border-b border-[#C9A962]/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-8 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Bitcoin className="h-3.5 w-3.5 text-[#F7931A]" />
                <span className="text-white/60">BTC</span>
                <span className="text-white font-medium">{formatBtcPrice()}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-white/60">ETH</span>
                <span className="text-white font-medium">
                  ${prices ? Math.round(prices.eth / 3.67).toLocaleString() : "..."}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <span className="hidden sm:inline">🔴 Live Prices</span>
              <span>|</span>
              <span>Crypto-friendly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/drecrypto" className="flex items-center gap-2">
            <Image
              src="/header_logo_7708_dre-logo-b (1).png"
              alt="DreCrypto"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
            <span className="text-[#C9A962] font-semibold text-sm hidden sm:block">CRYPTO</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-[#C9A962] text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Contact CTA */}
            <Link href="/drecrypto#contact" className="hidden sm:block">
              <Button className="bg-[#C9A962] hover:bg-[#b8994d] text-black text-sm h-9">
                Get Started
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0a0a] border-t border-white/10">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/80 hover:text-[#C9A962] text-lg py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <Link href="/drecrypto#contact" className="block">
                <Button className="w-full bg-[#C9A962] hover:bg-[#b8994d] text-black">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
