"use client"

import Link from "next/link"
import Image from "next/image"
import { Bitcoin, Mail, Phone, MapPin, MessageCircle } from "lucide-react"

const QUICK_LINKS = [
  { label: "Buy Property", href: "/drecrypto/buy" },
  { label: "Off-Plan Projects", href: "/drecrypto/offplan" },
  { label: "How It Works", href: "/drecrypto/how-it-works" },
  { label: "FAQ", href: "/drecrypto/faq" },
  { label: "About Us", href: "/drecrypto/about" },
]

const CRYPTO_ACCEPTED = [
  { name: "Bitcoin", symbol: "BTC", color: "#F7931A" },
  { name: "Ethereum", symbol: "ETH", color: "#627EEA" },
  { name: "Tether", symbol: "USDT", color: "#26A17B" },
  { name: "USD Coin", symbol: "USDC", color: "#2775CA" },
]

export function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link href="/drecrypto" className="flex items-center gap-2 mb-6">
              <Image
                src="/header_logo_7708_dre-logo-b (1).png"
                alt="DreCrypto"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <span className="text-[#C9A962] font-semibold text-sm">CRYPTO</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Dubai&apos;s premier crypto-friendly real estate platform. 
              Buy property with Bitcoin, Ethereum, and USDT.
            </p>
            <div className="flex items-center gap-3">
              {CRYPTO_ACCEPTED.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${crypto.color}20`, color: crypto.color }}
                  title={crypto.name}
                >
                  {crypto.symbol.slice(0, 1)}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#C9A962] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-medium mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+971527543243"
                  className="flex items-center gap-3 text-white/60 hover:text-[#C9A962] text-sm transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  +971 52 754 3243
                </a>
              </li>
              <li>
                <a
                  href="mailto:wilson@drehomes.com"
                  className="flex items-center gap-3 text-white/60 hover:text-[#C9A962] text-sm transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  wilson@drehomes.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/+971527543243"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 hover:text-[#C9A962] text-sm transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <MapPin className="h-4 w-4 mt-0.5" />
                Dubai, United Arab Emirates
              </li>
            </ul>
          </div>

          {/* Trust Badges */}
          <div>
            <h4 className="text-white font-medium mb-6">Trusted & Secure</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded">
                <Bitcoin className="h-5 w-5 text-[#F7931A]" />
                <div>
                  <p className="text-white text-sm font-medium">Crypto Verified</p>
                  <p className="text-white/50 text-xs">Secure transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded">
                <div className="w-5 h-5 bg-[#C9A962] rounded-full flex items-center justify-center text-black text-xs font-bold">
                  R
                </div>
                <div>
                  <p className="text-white text-sm font-medium">RERA Licensed</p>
                  <p className="text-white/50 text-xs">Dubai certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} DreCrypto by DRE Homes. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-white/40 hover:text-white/60">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/40 hover:text-white/60">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
