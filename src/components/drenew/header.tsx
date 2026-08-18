"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Phone, Mail, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NAV_LINKS, CONTACT_INFO } from "./data"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Gold accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A962] to-transparent z-[60]" />

      {/* Top Bar */}
      <div className="hidden lg:block fixed top-[2px] left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href={`tel:${CONTACT_INFO.tollFree}`} className="text-white/60 hover:text-[#C9A962] flex items-center gap-2 transition-colors">
              <Phone className="h-3 w-3" />
              {CONTACT_INFO.tollFree}
            </a>
            <a href={`mailto:${CONTACT_INFO.email}`} className="text-white/60 hover:text-[#C9A962] flex items-center gap-2 transition-colors">
              <Mail className="h-3 w-3" />
              {CONTACT_INFO.email}
            </a>
          </div>
          <div className="text-white/40">
            RERA Permit: {CONTACT_INFO.reraPermit}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`fixed top-[2px] lg:top-[42px] left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/drenew" className="flex items-center gap-3 group">
              <div className="w-10 h-10 border border-[#C9A962] flex items-center justify-center transition-all group-hover:bg-[#C9A962]/10">
                <span className="text-lg font-bold text-[#C9A962]">D</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-light text-white tracking-wider">DRE HOMES</span>
                <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase">Dubai Real Estate</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/70 hover:text-[#C9A962] transition-colors tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border border-white/30 !bg-transparent !text-white hover:bg-white/10 rounded-none"
              >
                <Download className="mr-2 h-4 w-4" />
                Brochure
              </Button>
              <Link href="/drenew/contact">
                <Button
                  size="sm"
                  className="bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none"
                >
                  Register Interest
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0a0a]/98 backdrop-blur-xl border-t border-white/10 py-4">
            <div className="container mx-auto px-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-white/70 hover:text-[#C9A962] transition-colors py-3 border-b border-white/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 space-y-3">
                <Link href="/drenew/contact" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none">
                    Register Interest
                  </Button>
                </Link>
              </div>
              <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
                <a href={`tel:${CONTACT_INFO.tollFree}`} className="flex items-center gap-2 text-white/50 hover:text-[#C9A962]">
                  <Phone className="h-4 w-4" />
                  {CONTACT_INFO.tollFree}
                </a>
                <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-2 text-white/50 hover:text-[#C9A962]">
                  <Mail className="h-4 w-4" />
                  {CONTACT_INFO.email}
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
