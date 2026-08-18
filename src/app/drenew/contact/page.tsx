"use client"

import { useState } from "react"
import { PageHero } from "@/components/drenew/shared/page-hero"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { 
  MapPin, Phone, Mail, Clock, Send, 
  Instagram, Youtube, Linkedin, Facebook,
  MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const CONTACT_INFO = {
  headquarters: {
    name: "Headquarters",
    address: "Park Heights Square 2, Offices 401-402-405-406, Dubai Hills Estate, Dubai, UAE",
    mapUrl: "https://maps.app.goo.gl/zHNjkBSkwTs6xGsp8",
  },
  branch: {
    name: "Town Square Branch",
    address: "Street Shop 2, Community Center, Town Square Nshama Al Qudra, Dubai, UAE",
    mapUrl: "https://maps.app.goo.gl/42FBpCmPsNUR667V6",
  },
  tollFree: "800 37373",
  hotline: "+971 52 754 3243",
  email: "sales@drehomes.com",
  whatsapp: "+971527543243",
  workingHours: {
    weekdays: "9:00 AM - 6:00 PM",
    saturday: "10:00 AM - 4:00 PM",
    sunday: "Closed",
  },
  social: {
    instagram: "https://www.instagram.com/drehomes_realestate/",
    youtube: "https://www.youtube.com/@drehomes",
    linkedin: "https://www.linkedin.com/company/drehomes/",
    facebook: "https://www.facebook.com/drehomesrealestate/",
  },
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Ready to find your dream property? Our team is here to help you every step of the way."
        breadcrumbs={[{ label: "Contact" }]}
        compact
      />

      {/* Contact Section */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              {/* Offices */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">Our Offices</h2>
                
                <div className="space-y-6">
                  {/* Headquarters */}
                  <div className="p-6 bg-white/5 border border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 border border-[#C9A962]/50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-[#C9A962]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">
                          {CONTACT_INFO.headquarters.name}
                        </h3>
                        <p className="text-white/60 text-sm mb-3">
                          {CONTACT_INFO.headquarters.address}
                        </p>
                        <a
                          href={CONTACT_INFO.headquarters.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C9A962] text-sm hover:underline"
                        >
                          View on Map →
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Branch */}
                  <div className="p-6 bg-white/5 border border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 border border-[#C9A962]/50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-[#C9A962]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">
                          {CONTACT_INFO.branch.name}
                        </h3>
                        <p className="text-white/60 text-sm mb-3">
                          {CONTACT_INFO.branch.address}
                        </p>
                        <a
                          href={CONTACT_INFO.branch.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C9A962] text-sm hover:underline"
                        >
                          View on Map →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Methods */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">Get in Touch</h2>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <a
                    href={`tel:${CONTACT_INFO.tollFree}`}
                    className="p-4 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-[#C9A962]" />
                      <div>
                        <p className="text-white/50 text-xs uppercase">Toll Free</p>
                        <p className="text-white group-hover:text-[#C9A962] transition-colors">
                          {CONTACT_INFO.tollFree}
                        </p>
                      </div>
                    </div>
                  </a>

                  <a
                    href={`tel:${CONTACT_INFO.hotline}`}
                    className="p-4 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-[#C9A962]" />
                      <div>
                        <p className="text-white/50 text-xs uppercase">Hotline</p>
                        <p className="text-white group-hover:text-[#C9A962] transition-colors">
                          {CONTACT_INFO.hotline}
                        </p>
                      </div>
                    </div>
                  </a>

                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="p-4 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-[#C9A962]" />
                      <div>
                        <p className="text-white/50 text-xs uppercase">Email</p>
                        <p className="text-white group-hover:text-[#C9A962] transition-colors">
                          {CONTACT_INFO.email}
                        </p>
                      </div>
                    </div>
                  </a>

                  <a
                    href={`https://wa.me/${CONTACT_INFO.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-green-600/20 border border-green-600/50 hover:bg-green-600/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-white/50 text-xs uppercase">WhatsApp</p>
                        <p className="text-white">Chat with Us</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">Working Hours</h2>
                
                <div className="p-6 bg-white/5 border border-white/10">
                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-[#C9A962] mt-1" />
                    <div className="space-y-2">
                      <div className="flex justify-between gap-8">
                        <span className="text-white/60">Monday - Friday</span>
                        <span className="text-white">{CONTACT_INFO.workingHours.weekdays}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-white/60">Saturday</span>
                        <span className="text-white">{CONTACT_INFO.workingHours.saturday}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-white/60">Sunday</span>
                        <span className="text-white">{CONTACT_INFO.workingHours.sunday}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">Follow Us</h2>
                
                <div className="flex gap-4">
                  <a
                    href={CONTACT_INFO.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all group"
                  >
                    <Instagram className="h-5 w-5 text-white/60 group-hover:text-[#C9A962]" />
                  </a>
                  <a
                    href={CONTACT_INFO.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all group"
                  >
                    <Youtube className="h-5 w-5 text-white/60 group-hover:text-[#C9A962]" />
                  </a>
                  <a
                    href={CONTACT_INFO.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all group"
                  >
                    <Linkedin className="h-5 w-5 text-white/60 group-hover:text-[#C9A962]" />
                  </a>
                  <a
                    href={CONTACT_INFO.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all group"
                  >
                    <Facebook className="h-5 w-5 text-white/60 group-hover:text-[#C9A962]" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="bg-white/5 border border-white/10 p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border border-[#C9A962] flex items-center justify-center mx-auto mb-4">
                      <Send className="h-6 w-6 text-[#C9A962]" />
                    </div>
                    <h3 className="text-2xl font-light text-white mb-2">Thank You!</h3>
                    <p className="text-white/60">
                      Your message has been sent. Our team will contact you shortly.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-light text-white mb-2">
                      Send Us a Message
                    </h2>
                    <p className="text-white/60 text-sm mb-8">
                      Fill out the form below and we&apos;ll get back to you within 24 hours.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-white/60 text-sm mb-2 block">Name *</label>
                          <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-transparent border-white/20 text-white rounded-none focus:border-[#C9A962] focus:ring-0"
                          />
                        </div>
                        <div>
                          <label className="text-white/60 text-sm mb-2 block">Email *</label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="bg-transparent border-white/20 text-white rounded-none focus:border-[#C9A962] focus:ring-0"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-white/60 text-sm mb-2 block">Phone *</label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            className="bg-transparent border-white/20 text-white rounded-none focus:border-[#C9A962] focus:ring-0"
                          />
                        </div>
                        <div>
                          <label className="text-white/60 text-sm mb-2 block">Interest</label>
                          <select
                            value={formData.interest}
                            onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                            className="w-full px-3 py-2 bg-transparent border border-white/20 text-white rounded-none focus:border-[#C9A962] focus:outline-none"
                          >
                            <option value="" className="bg-[#0a0a0a]">Select...</option>
                            <option value="buy" className="bg-[#0a0a0a]">Buy Property</option>
                            <option value="rent" className="bg-[#0a0a0a]">Rent Property</option>
                            <option value="off-plan" className="bg-[#0a0a0a]">Off-Plan Investment</option>
                            <option value="sell" className="bg-[#0a0a0a]">Sell Property</option>
                            <option value="other" className="bg-[#0a0a0a]">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Message</label>
                        <textarea
                          rows={4}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-3 py-2 bg-transparent border border-white/20 text-white rounded-none focus:border-[#C9A962] focus:outline-none resize-none"
                          placeholder="Tell us about your requirements..."
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none py-3"
                      >
                        {loading ? "Sending..." : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-[400px] bg-white/5 border-t border-white/10">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3612.4321234567891!2d55.2544556!3d25.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDA3JzI0LjQiTiA1NcKwMTUnMTYuMCJF!5e0!3m2!1sen!2sae!4v1234567890123"
          width="100%"
          height="100%"
          style={{ border: 0, filter: "grayscale(100%) invert(92%) contrast(83%)" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <CTABanner variant="gold" />
    </>
  )
}
