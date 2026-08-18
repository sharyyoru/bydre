"use client"

import Link from "next/link"
import { ArrowRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CTABannerProps {
  title?: string
  subtitle?: string
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  variant?: "default" | "gold"
}

export function CTABanner({
  title = "Ready to Find Your Dream Home?",
  subtitle = "Our expert team is here to help you navigate Dubai's real estate market.",
  primaryAction = { label: "Contact Us", href: "/drenew/contact" },
  secondaryAction = { label: "Browse Properties", href: "/drenew/offplan" },
  variant = "default",
}: CTABannerProps) {
  const isGold = variant === "gold"

  return (
    <section
      className={`py-16 lg:py-20 ${
        isGold
          ? "bg-gradient-to-r from-[#C9A962] via-[#D4AF37] to-[#C9A962]"
          : "bg-[#0a0a0a] border-y border-white/10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Text */}
          <div className="text-center lg:text-left">
            <h2
              className={`text-2xl lg:text-3xl font-light ${
                isGold ? "text-black" : "text-white"
              }`}
            >
              {title}
            </h2>
            <p
              className={`mt-2 ${
                isGold ? "text-black/70" : "text-white/60"
              }`}
            >
              {subtitle}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={primaryAction.href}>
              <Button
                className={`rounded-none px-8 py-3 ${
                  isGold
                    ? "bg-black hover:bg-black/80 text-white"
                    : "bg-[#C9A962] hover:bg-[#B8985A] text-black"
                }`}
              >
                {primaryAction.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <a href="tel:+971527543243">
              <Button
                variant="outline"
                className={`rounded-none px-8 py-3 ${
                  isGold
                    ? "border-black text-black hover:bg-black/10"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Now
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
