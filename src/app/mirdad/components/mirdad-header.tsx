"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "./language-switcher"
import { cn } from "@/lib/utils"

interface Project {
  contact_phone?: string
}

interface MirdadHeaderProps {
  locale: "en" | "fr" | "ar"
  dict: {
    nav: {
      residences: string
      amenities: string
      location: string
      developer: string
      contact: string
      registerInterest: string
    }
  }
  project?: Project | null
}

export function MirdadHeader({ locale, dict }: MirdadHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const basePath = locale === "fr" ? "/mirdad/fr" : locale === "ar" ? "/mirdad/ar" : "/mirdad"

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "#residences", label: dict.nav.residences },
    { href: "#amenities", label: dict.nav.amenities },
    { href: "#location", label: dict.nav.location },
    { href: "#developer", label: dict.nav.developer },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/10"
          : "bg-transparent"
      )}
    >
      {/* Top bar */}
      <div className="hidden lg:block border-b border-white/10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-end text-sm">
          <div className="flex items-center gap-4">
            <span className="text-white/40">A Development by Union Properties</span>
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>
      </div>

      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={basePath} className="flex items-center gap-3 group">
            <div className="w-10 h-10 border border-[#C9A962] flex items-center justify-center">
              <span className="text-lg font-bold text-[#C9A962]">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-light text-white tracking-wider">MIRDAD</span>
              <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase">By Union Properties</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-white/70 hover:text-[#C9A962] transition-colors tracking-wide"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="hidden md:flex border border-white/30 !bg-transparent !text-white hover:bg-white/10 rounded-none"
            >
              <Download className="mr-2 h-4 w-4" />
              Brochure
            </Button>
            <a href="#register">
              <Button
                size="sm"
                className="bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none"
              >
                {dict.nav.registerInterest}
              </Button>
            </a>

            {/* Mobile: Language + Menu */}
            <div className="lg:hidden flex items-center gap-2">
              <LanguageSwitcher currentLocale={locale} />
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/10 pt-4 bg-[#0a0a0a]">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-white/70 hover:text-[#C9A962] transition-colors py-3 border-b border-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a href="#register" onClick={() => setMobileMenuOpen(false)} className="mt-4">
                <Button className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none">
                  {dict.nav.registerInterest}
                </Button>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
