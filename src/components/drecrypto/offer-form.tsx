"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bitcoin, CheckCircle, Wallet, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useCryptoPrices } from "./crypto-price-context"

interface OfferFormProps {
  propertyId: number
  propertyName: string
  priceAed: number
}

export function OfferForm({ propertyId, propertyName, priceAed }: OfferFormProps) {
  const { convertToCrypto, formatCrypto } = useCryptoPrices()
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cryptoType: "BTC",
    offerAmount: priceAed.toString(),
    walletAddress: "",
    message: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const offerCrypto = convertToCrypto(parseFloat(formData.offerAmount), formData.cryptoType.toLowerCase() as "btc" | "eth" | "usdt")

      const res = await fetch("/api/drecrypto/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          propertyName,
          buyerName: formData.name,
          buyerEmail: formData.email,
          buyerPhone: formData.phone,
          offerAmountAed: parseFloat(formData.offerAmount),
          offerAmountCrypto: offerCrypto,
          cryptoType: formData.cryptoType,
          walletAddress: formData.walletAddress || null,
          message: formData.message
        })
      })

      if (!res.ok) throw new Error("Failed to submit offer")

      setSubmitted(true)
      toast.success("Offer submitted successfully!")
    } catch (error) {
      toast.error("Failed to submit offer. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white/5 border border-white/10 p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl text-white font-medium mb-2">Offer Submitted!</h3>
        <p className="text-white/60 mb-4">
          Our team will review your offer and contact you within 24 hours.
        </p>
        <Button
          variant="outline"
          onClick={() => setSubmitted(false)}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Submit Another Offer
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6">
      <h3 className="text-lg text-white font-medium mb-6 flex items-center gap-2">
        <Bitcoin className="h-5 w-5 text-[#C9A962]" />
        Make an Offer
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Details */}
        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Full Name *</label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-white/5 border-white/20 text-white"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Email *</label>
          <Input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-white/5 border-white/20 text-white"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Phone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-white/5 border-white/20 text-white"
            placeholder="+971 50 123 4567"
          />
        </div>

        {/* Crypto Selection */}
        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Preferred Crypto</label>
          <div className="flex gap-2">
            {["BTC", "ETH", "USDT"].map((crypto) => (
              <button
                key={crypto}
                type="button"
                onClick={() => setFormData({ ...formData, cryptoType: crypto })}
                className={`flex-1 py-2.5 text-sm font-medium border transition-colors ${
                  formData.cryptoType === crypto
                    ? "bg-[#C9A962] text-black border-[#C9A962]"
                    : "bg-transparent text-white/70 border-white/20 hover:border-white/40"
                }`}
              >
                {crypto}
              </button>
            ))}
          </div>
        </div>

        {/* Offer Amount */}
        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Offer Amount (AED)</label>
          <Input
            type="number"
            value={formData.offerAmount}
            onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
            className="bg-white/5 border-white/20 text-white"
            placeholder={priceAed.toString()}
          />
          <p className="text-[#C9A962] text-sm mt-1">
            ≈ {formatCrypto(
              convertToCrypto(parseFloat(formData.offerAmount) || 0, formData.cryptoType.toLowerCase() as "btc" | "eth" | "usdt"),
              formData.cryptoType.toLowerCase() as "btc" | "eth" | "usdt"
            )}
          </p>
        </div>

        {/* Wallet Address */}
        <div>
          <label className="text-white/60 text-sm mb-1.5 block flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Address (Optional)
          </label>
          <Input
            value={formData.walletAddress}
            onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
            className="bg-white/5 border-white/20 text-white font-mono text-sm"
            placeholder="0x... or bc1..."
          />
          <p className="text-white/40 text-xs mt-1">
            Providing your wallet address helps verify you have the funds for faster processing
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Message (Optional)</label>
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="bg-white/5 border-white/20 text-white min-h-[80px]"
            placeholder="Any additional details..."
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#C9A962] hover:bg-[#b8994d] text-black h-12"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Offer
            </>
          )}
        </Button>
      </form>

      <p className="text-white/40 text-xs text-center mt-4">
        By submitting, you agree to our terms. No payment required at this stage.
      </p>
    </div>
  )
}
