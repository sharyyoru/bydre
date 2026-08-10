"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "./language-switcher"

interface MirdadHeaderProps {
  locale: "en" | "fr"
  dict: {
    nav: {
      collection: string
      about: string
      faq: string
      contact: string
      getStarted: string
    }
  }
}

export function MirdadHeader({ locale, dict }: MirdadHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const basePath = locale === "fr" ? "/mirdad/fr" : "/mirdad"

  const navItems = [
    { href: "#collection", label: dict.nav.collection },
    { href: "#faq", label: dict.nav.faq },
    { href: "#contact", label: dict.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={basePath} className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <Wrench className="h-6 w-6 text-amber-500" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Mirdad
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={locale} />
            <a href="#contact" className="hidden sm:block">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium">
                {dict.nav.getStarted}
              </Button>
            </a>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-800 pt-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-slate-300 hover:text-white transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium">
                  {dict.nav.getStarted}
                </Button>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
