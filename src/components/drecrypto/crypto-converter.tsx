"use client"

import { useState } from "react"
import { Bitcoin, RefreshCw, ArrowRightLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCryptoPrices } from "./crypto-price-context"

interface CryptoConverterProps {
  defaultAed?: number
}

export function CryptoConverter({ defaultAed = 0 }: CryptoConverterProps) {
  const [aedAmount, setAedAmount] = useState(defaultAed.toString())
  const { prices, loading, refreshPrices, convertToCrypto, formatCrypto } = useCryptoPrices()

  const aed = parseFloat(aedAmount) || 0

  return (
    <div className="bg-white/5 border border-white/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-[#C9A962]" />
          Crypto Converter
        </h3>
        <button
          onClick={refreshPrices}
          className="text-white/60 hover:text-[#C9A962] transition-colors"
          title="Refresh prices"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* AED Input */}
      <div>
        <label className="text-white/60 text-sm mb-2 block">Amount in AED</label>
        <div className="relative">
          <Input
            type="number"
            value={aedAmount}
            onChange={(e) => setAedAmount(e.target.value)}
            className="bg-white/5 border-white/20 text-white text-lg h-12 pr-16"
            placeholder="0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">AED</span>
        </div>
      </div>

      {/* Crypto Outputs */}
      <div className="space-y-3 pt-2">
        {/* BTC */}
        <div className="flex items-center justify-between p-3 bg-[#F7931A]/10 border border-[#F7931A]/20 rounded">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-[#F7931A]" />
            <span className="text-white/80 text-sm">Bitcoin</span>
          </div>
          <span className="text-white font-medium">
            {formatCrypto(convertToCrypto(aed, "btc"), "btc")}
          </span>
        </div>

        {/* ETH */}
        <div className="flex items-center justify-between p-3 bg-[#627EEA]/10 border border-[#627EEA]/20 rounded">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#627EEA] flex items-center justify-center text-white text-xs font-bold">Ξ</div>
            <span className="text-white/80 text-sm">Ethereum</span>
          </div>
          <span className="text-white font-medium">
            {formatCrypto(convertToCrypto(aed, "eth"), "eth")}
          </span>
        </div>

        {/* USDT */}
        <div className="flex items-center justify-between p-3 bg-[#26A17B]/10 border border-[#26A17B]/20 rounded">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#26A17B] flex items-center justify-center text-white text-xs font-bold">₮</div>
            <span className="text-white/80 text-sm">Tether</span>
          </div>
          <span className="text-white font-medium">
            {formatCrypto(convertToCrypto(aed, "usdt"), "usdt")}
          </span>
        </div>
      </div>

      {/* Rate Info */}
      {prices && (
        <p className="text-white/40 text-xs text-center pt-2">
          Live rates updated {new Date(prices.updated_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
