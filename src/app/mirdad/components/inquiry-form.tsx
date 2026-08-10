"use client"

import { useState } from "react"
import { Send, CheckCircle2, AlertCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface InquiryFormProps {
  locale: "en" | "fr"
  dict: {
    inquiry: {
      title: string
      subtitle: string
      form: {
        name: string
        namePlaceholder: string
        email: string
        emailPlaceholder: string
        phone: string
        phonePlaceholder: string
        type: string
        typePlaceholder: string
        types: Record<string, string>
        message: string
        messagePlaceholder: string
        submit: string
        submitting: string
        success: string
        error: string
      }
    }
  }
}

type FormStatus = "idle" | "submitting" | "success" | "error"

export function InquiryForm({ locale, dict }: InquiryFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")

    try {
      const res = await fetch("/api/mirdad/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          preferredLanguage: locale,
        }),
      })

      if (res.ok) {
        setStatus("success")
        setFormData({
          name: "",
          email: "",
          phone: "",
          inquiryType: "",
          message: "",
        })
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <section id="contact" className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {dict.inquiry.form.success}
            </h2>
            <Button
              onClick={() => setStatus("idle")}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              {locale === "fr" ? "Envoyer une autre demande" : "Send another inquiry"}
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
              <Mail className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-400">
                {locale === "fr" ? "Contactez-nous" : "Get in Touch"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              {dict.inquiry.title}
            </h2>
            <p className="text-slate-400">{dict.inquiry.subtitle}</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8"
          >
            {status === "error" && (
              <div className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{dict.inquiry.form.error}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  {dict.inquiry.form.name} *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={dict.inquiry.form.namePlaceholder}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[44px]"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  {dict.inquiry.form.email} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={dict.inquiry.form.emailPlaceholder}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[44px]"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  {dict.inquiry.form.phone}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={dict.inquiry.form.phonePlaceholder}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[44px]"
                />
              </div>

              {/* Inquiry Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-300">
                  {dict.inquiry.form.type}
                </Label>
                <Select
                  value={formData.inquiryType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, inquiryType: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white min-h-[44px]">
                    <SelectValue
                      placeholder={dict.inquiry.form.typePlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(dict.inquiry.form.types).map(
                      ([key, label]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="text-white focus:bg-slate-700"
                        >
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="message" className="text-slate-300">
                {dict.inquiry.form.message}
              </Label>
              <Textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder={dict.inquiry.form.messagePlaceholder}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold min-h-[48px]"
            >
              {status === "submitting" ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {dict.inquiry.form.submitting}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {dict.inquiry.form.submit}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
