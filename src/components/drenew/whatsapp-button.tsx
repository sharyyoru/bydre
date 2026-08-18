"use client"

import { MessageCircle } from "lucide-react"
import { CONTACT_INFO } from "./data"

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi, I'm interested in DRE Homes properties.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#C9A962] hover:bg-[#B8985A] text-black px-5 py-3 shadow-lg shadow-black/30 hover:shadow-xl transition-all group"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden md:inline font-semibold">
        Chat with us
      </span>
    </a>
  )
}
