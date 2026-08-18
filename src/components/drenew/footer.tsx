"use client"

import Link from "next/link"
import { Instagram, Youtube, Linkedin, Facebook, Phone, Mail, MapPin } from "lucide-react"
import { CONTACT_INFO } from "./data"

const FOOTER_LINKS = {
  buy: [
    { label: "Apartments for Sale", href: "#" },
    { label: "Villas for Sale", href: "#" },
    { label: "Townhouses for Sale", href: "#" },
    { label: "Penthouses for Sale", href: "#" },
    { label: "Off-Plan Properties", href: "#" },
  ],
  rent: [
    { label: "Apartments for Rent", href: "#" },
    { label: "Villas for Rent", href: "#" },
    { label: "Short Term Rentals", href: "#" },
    { label: "Commercial Spaces", href: "#" },
  ],
  communities: [
    { label: "Downtown Dubai", href: "#" },
    { label: "Palm Jumeirah", href: "#" },
    { label: "Dubai Marina", href: "#" },
    { label: "Dubai Hills Estate", href: "#" },
    { label: "Business Bay", href: "#" },
    { label: "JVC", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#about" },
    { label: "Our Team", href: "#" },
    { label: "Careers", href: "#" },
    { label: "News & Blog", href: "#" },
    { label: "Contact Us", href: "#contact" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white border-t border-white/10">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Logo & About */}
          <div className="lg:col-span-2">
            <Link href="/drenew" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border border-[#C9A962] flex items-center justify-center">
                <span className="text-lg font-bold text-[#C9A962]">D</span>
              </div>
              <div>
                <span className="text-xl font-light text-white tracking-wider">DRE HOMES</span>
                <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase">Dubai Real Estate</p>
              </div>
            </Link>
            <p className="text-white/50 text-sm mb-6 max-w-xs font-light">
              Dubai&apos;s trusted real estate partner. We help you find homes directly with top developers across Dubai&apos;s most prestigious locations.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href={CONTACT_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={CONTACT_INFO.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href={CONTACT_INFO.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={CONTACT_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Buy Links */}
          <div>
            <h4 className="font-semibold mb-4">Buy Property</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.buy.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/50 hover:text-[#C9A962] text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Rent Links */}
          <div>
            <h4 className="font-semibold mb-4">Rent Property</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.rent.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/50 hover:text-[#C9A962] text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Communities */}
          <div>
            <h4 className="font-semibold mb-4">Communities</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.communities.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/50 hover:text-[#C9A962] text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/50 hover:text-[#C9A962] text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Row */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center">
                <Phone className="h-5 w-5 text-[#C9A962]" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Call Us</p>
                <a href={`tel:${CONTACT_INFO.tollFree}`} className="font-semibold hover:text-[#C9A962] transition-colors">
                  {CONTACT_INFO.tollFree}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-[#C9A962]" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Email Us</p>
                <a href={`mailto:${CONTACT_INFO.email}`} className="font-semibold hover:text-[#C9A962] transition-colors">
                  {CONTACT_INFO.email}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-[#C9A962]" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Headquarters</p>
                <span className="font-semibold">Dubai Hills Estate, UAE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-400 text-sm">
              © {new Date().getFullYear()} DRE Homes Real Estate. All rights reserved. RERA Permit: {CONTACT_INFO.reraPermit}
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                Terms & Conditions
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
