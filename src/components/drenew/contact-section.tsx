"use client"

import { useState } from "react"
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CONTACT_INFO } from "./data"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "buying",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo: just log the form data
    console.log("Form submitted:", formData)
    alert("Thank you for your inquiry! Our team will contact you shortly.")
  }

  return (
    <section id="contact" className="py-20 lg:py-32 bg-[#0a0a0a] border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Get In Touch</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-6">
              Let&apos;s Find Your Perfect Property
            </h2>
            <p className="text-white/60 mb-10 max-w-md font-light">
              Whether you&apos;re buying, selling, or investing, our team of experts is here to guide you every step of the way.
            </p>

            {/* Contact Cards */}
            <div className="space-y-6">
              {/* HQ */}
              <div className="flex gap-4">
                <div className="w-12 h-12 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-[#C9A962]" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{CONTACT_INFO.headquarters.name}</h4>
                  <p className="text-slate-400 text-sm">{CONTACT_INFO.headquarters.address}</p>
                </div>
              </div>

              {/* Branch */}
              <div className="flex gap-4">
                <div className="w-12 h-12 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-[#C9A962]" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{CONTACT_INFO.branch.name}</h4>
                  <p className="text-slate-400 text-sm">{CONTACT_INFO.branch.address}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="w-12 h-12 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-[#C9A962]" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Call Us</h4>
                  <p className="text-slate-400 text-sm">
                    Toll Free: <a href={`tel:${CONTACT_INFO.tollFree}`} className="text-[#C9A962] hover:underline">{CONTACT_INFO.tollFree}</a>
                  </p>
                  <p className="text-slate-400 text-sm">
                    Hotline: <a href={`tel:${CONTACT_INFO.hotline}`} className="text-[#C9A962] hover:underline">{CONTACT_INFO.hotline}</a>
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="w-12 h-12 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-[#C9A962]" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Email Us</h4>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="text-[#C9A962] hover:underline text-sm">
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex gap-4">
                <div className="w-12 h-12 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-[#C9A962]" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Working Hours</h4>
                  <p className="text-slate-400 text-sm">
                    Sun - Thu: 9:00 AM - 6:00 PM
                  </p>
                  <p className="text-slate-400 text-sm">
                    Fri - Sat: 10:00 AM - 4:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="mt-10">
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi, I'm interested in DRE Homes properties.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#C9A962] hover:bg-[#B8985A] text-black px-6 py-3 font-semibold transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
            <h3 className="text-2xl font-light text-white mb-2">
              Send Us a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <Input
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-[#C9A962]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-[#C9A962]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-[#C9A962]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  I&apos;m Interested In
                </label>
                <select
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  className="w-full h-12 px-4 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:border-[#C9A962]"
                >
                  <option value="buying" className="bg-slate-900">Buying Property</option>
                  <option value="renting" className="bg-slate-900">Renting Property</option>
                  <option value="selling" className="bg-slate-900">Selling Property</option>
                  <option value="investing" className="bg-slate-900">Property Investment</option>
                  <option value="offplan" className="bg-slate-900">Off-Plan Projects</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us about your requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-[#C9A962]"
                />
              </div>

              <Button type="submit" className="w-full h-12 bg-[#C9A962] hover:bg-[#B8985A] text-black text-base font-semibold rounded-none">
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </Button>

              <p className="text-xs text-slate-400 text-center">
                By submitting this form, you agree to our{" "}
                <a href="#" className="text-[#C9A962] hover:underline">Privacy Policy</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
