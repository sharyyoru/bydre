"use client"

import { useState } from "react"
import { Send, CheckCircle2, AlertCircle, Phone, MessageCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Unit {
  unit_type: string
  title: string
}

interface LeadFormProps {
  locale: "en" | "fr" | "ar"
  dict: {
    form: {
      title: string
      subtitle: string
      name: string
      namePlaceholder: string
      email: string
      emailPlaceholder: string
      phone: string
      phonePlaceholder: string
      country: string
      countryPlaceholder: string
      unitType: string
      unitTypePlaceholder: string
      message: string
      messagePlaceholder: string
      brochure: string
      submit: string
      submitting: string
      success: string
      error: string
    }
    contact: {
      title: string
      subtitle: string
      phone: string
      whatsapp: string
      email: string
    }
    units: {
      types: Record<string, string>
    }
  }
  units: Unit[]
}

type FormStatus = "idle" | "submitting" | "success" | "error"

export function LeadForm({ locale, dict, units }: LeadFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [brochureRequested, setBrochureRequested] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    unitType: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")

    try {
      const res = await fetch("/api/mirdad/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          brochureRequested,
          preferredLanguage: locale,
          source: "website",
        }),
      })

      if (res.ok) {
        setStatus("success")
        setFormData({
          name: "",
          email: "",
          phone: "",
          country: "",
          unitType: "",
          message: "",
        })
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <section id="register" className="py-20 lg:py-32 bg-[#0a0a0a] relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#C9A962]/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Form */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Register</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
              {dict.form.title}
            </h2>
            <p className="text-white/60 mb-8">{dict.form.subtitle}</p>

            {status === "success" ? (
              <div className="p-8 bg-green-500/10 border border-green-500/30 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-white text-lg">{dict.form.success}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {status === "error" && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{dict.form.error}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">{dict.form.name} *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={dict.form.namePlaceholder}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none h-12 focus:border-[#C9A962]"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">{dict.form.email} *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={dict.form.emailPlaceholder}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none h-12 focus:border-[#C9A962]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">{dict.form.phone} *</label>
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={dict.form.phonePlaceholder}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none h-12 focus:border-[#C9A962]"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">{dict.form.unitType}</label>
                    <select
                      value={formData.unitType}
                      onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                      className="w-full h-12 px-3 bg-white/5 border border-white/10 text-white/80 rounded-none focus:outline-none focus:border-[#C9A962]"
                    >
                      <option value="" className="bg-[#0a0a0a]">{dict.form.unitTypePlaceholder}</option>
                      {units.map((unit) => (
                        <option key={unit.unit_type} value={unit.unit_type} className="bg-[#0a0a0a]">
                          {dict.units.types[unit.unit_type] || unit.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">{dict.form.message}</label>
                  <Textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={dict.form.messagePlaceholder}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none resize-none focus:border-[#C9A962]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="brochure"
                    checked={brochureRequested}
                    onCheckedChange={(checked) => setBrochureRequested(checked as boolean)}
                    className="border-white/30 data-[state=checked]:bg-[#C9A962] data-[state=checked]:border-[#C9A962]"
                  />
                  <label htmlFor="brochure" className="text-white/70 text-sm cursor-pointer">
                    {dict.form.brochure}
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold py-6 text-base rounded-none"
                >
                  {status === "submitting" ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {dict.form.submitting}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      {dict.form.submit}
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Right: Contact Info */}
          <div className="lg:pl-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Contact</span>
            </div>

            <h3 className="text-2xl lg:text-3xl font-light text-white mb-4">
              {dict.contact.title}
            </h3>
            <p className="text-white/60 mb-8">{dict.contact.subtitle}</p>

            <div className="space-y-4">
              {/* Phone */}
              <a
                href="tel:+971800886466"
                className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center group-hover:bg-[#C9A962]/20">
                  <Phone className="w-5 h-5 text-[#C9A962]" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase">{dict.contact.phone}</p>
                  <p className="text-white font-medium">800 UPSALE (886466)</p>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/971800877253"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase">{dict.contact.whatsapp}</p>
                  <p className="text-white font-medium">+971 800 877253</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:info@up.ae"
                className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center group-hover:bg-[#C9A962]/20">
                  <Mail className="w-5 h-5 text-[#C9A962]" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase">{dict.contact.email}</p>
                  <p className="text-white font-medium">info@up.ae</p>
                </div>
              </a>
            </div>

            {/* Trust badge */}
            <div className="mt-8 p-6 border border-[#C9A962]/30 bg-[#C9A962]/5 text-center">
              <p className="text-[#C9A962] font-semibold text-lg">37+ Years of Trust</p>
              <p className="text-white/50 text-sm">Union Properties - Building Dreams Since 1987</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
