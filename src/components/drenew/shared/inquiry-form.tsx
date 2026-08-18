"use client"

import { useState } from "react"
import { Send, Phone, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InquiryFormProps {
  propertyName?: string
  title?: string
  subtitle?: string
}

export function InquiryForm({
  propertyName,
  title = "Interested in this property?",
  subtitle = "Leave your details and our team will get back to you shortly.",
}: InquiryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: propertyName
      ? `Hi, I'm interested in ${propertyName}. Please contact me with more details.`
      : "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white/5 border border-white/10 p-8 text-center">
        <div className="w-16 h-16 border border-[#C9A962] flex items-center justify-center mx-auto mb-4">
          <Send className="h-6 w-6 text-[#C9A962]" />
        </div>
        <h3 className="text-xl font-light text-white mb-2">Thank You!</h3>
        <p className="text-white/60">
          Your inquiry has been submitted. Our team will contact you shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6 lg:p-8">
      <h3 className="text-xl font-light text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm mb-6">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="pl-10 bg-transparent border-white/20 text-white placeholder:text-white/40 rounded-none focus:border-[#C9A962] focus:ring-0"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="pl-10 bg-transparent border-white/20 text-white placeholder:text-white/40 rounded-none focus:border-[#C9A962] focus:ring-0"
          />
        </div>

        {/* Phone */}
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="pl-10 bg-transparent border-white/20 text-white placeholder:text-white/40 rounded-none focus:border-[#C9A962] focus:ring-0"
          />
        </div>

        {/* Message */}
        <textarea
          placeholder="Your Message (Optional)"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 bg-transparent border border-white/20 text-white placeholder:text-white/40 rounded-none focus:border-[#C9A962] focus:outline-none resize-none"
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none py-3"
        >
          {loading ? (
            "Submitting..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Inquiry
            </>
          )}
        </Button>
      </form>

      {/* Or Call */}
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-white/50 text-sm mb-2">Or call us directly</p>
        <a
          href="tel:+971527543243"
          className="text-[#C9A962] font-medium hover:underline"
        >
          +971 52 754 3243
        </a>
      </div>
    </div>
  )
}
