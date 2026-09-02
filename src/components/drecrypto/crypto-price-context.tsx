"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"

interface CryptoPrices {
  btc: number
  eth: number
  usdt: number
  updated_at: string
}

interface CryptoPriceContextType {
  prices: CryptoPrices | null
  loading: boolean
  error: string | null
  refreshPrices: () => Promise<void>
  convertToCrypto: (aed: number, crypto: "btc" | "eth" | "usdt") => number
  formatCrypto: (amount: number, crypto: "btc" | "eth" | "usdt") => string
}

const CryptoPriceContext = createContext<CryptoPriceContextType | undefined>(undefined)

export function CryptoPriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<CryptoPrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/drecrypto/prices")
      if (!res.ok) throw new Error("Failed to fetch prices")
      const data = await res.json()
      setPrices(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      // Use fallback prices
      setPrices({
        btc: 350000,
        eth: 13000,
        usdt: 3.67,
        updated_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    // Refresh every 60 seconds
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  const convertToCrypto = useCallback((aed: number, crypto: "btc" | "eth" | "usdt"): number => {
    if (!prices) return 0
    const rate = prices[crypto]
    if (!rate || rate === 0) return 0
    return aed / rate
  }, [prices])

  const formatCrypto = useCallback((amount: number, crypto: "btc" | "eth" | "usdt"): string => {
    if (crypto === "btc") {
      return amount < 1 
        ? `${(amount * 1000).toFixed(2)} mBTC`
        : `${amount.toFixed(4)} BTC`
    }
    if (crypto === "eth") {
      return `${amount.toFixed(2)} ETH`
    }
    // USDT
    return `${Math.round(amount).toLocaleString()} USDT`
  }, [])

  return (
    <CryptoPriceContext.Provider
      value={{
        prices,
        loading,
        error,
        refreshPrices: fetchPrices,
        convertToCrypto,
        formatCrypto
      }}
    >
      {children}
    </CryptoPriceContext.Provider>
  )
}

export function useCryptoPrices() {
  const context = useContext(CryptoPriceContext)
  if (!context) {
    throw new Error("useCryptoPrices must be used within CryptoPriceProvider")
  }
  return context
}
