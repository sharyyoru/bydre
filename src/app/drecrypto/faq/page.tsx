"use client"

import Link from "next/link"
import { HelpCircle, ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FAQAccordion, FAQ_DATA } from "@/components/drecrypto"

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-full mb-6">
            <HelpCircle className="h-4 w-4 text-[#C9A962]" />
            <span className="text-[#C9A962] text-sm font-medium">Knowledge Base</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-white/60 text-lg">
            Everything you need to know about buying Dubai property with cryptocurrency. 
            Can&apos;t find what you&apos;re looking for? Contact us directly.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <FAQAccordion items={FAQ_DATA} showCategories={true} />
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-[#C9A962]/20 to-[#C9A962]/5 border border-[#C9A962]/30 p-8 md:p-12 text-center">
            <h2 className="text-2xl font-light text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-white/60 mb-8">
              Our crypto real estate experts are ready to help you with any questions 
              about buying property with Bitcoin, Ethereum, or USDT.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://wa.me/+971527543243?text=Hi, I have a question about buying property with crypto">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Us
                </Button>
              </a>
              <Link href="/drecrypto#contact">
                <Button size="lg" className="bg-[#C9A962] hover:bg-[#b8994d] text-black gap-2">
                  Get in Touch
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
