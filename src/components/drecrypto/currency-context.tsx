"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type CryptoType = "BTC" | "USDT"

interface CurrencyContextType {
  currency: CryptoType
  setCurrency: (currency: CryptoType) => void
  formatPrice: (priceBtc: number, priceUsdt: number) => string
  getPriceValue: (priceBtc: number, priceUsdt: number) => number
  getCurrencySymbol: () => string
  getCurrencyColor: () => string
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CryptoType>("BTC")

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("drecrypto-currency")
    if (saved === "BTC" || saved === "USDT") {
      setCurrencyState(saved)
    }
  }, [])

  const setCurrency = (newCurrency: CryptoType) => {
    setCurrencyState(newCurrency)
    localStorage.setItem("drecrypto-currency", newCurrency)
  }

  const formatPrice = (priceBtc: number, priceUsdt: number): string => {
    if (currency === "BTC") {
      if (priceBtc < 1) {
        return `${(priceBtc * 1000).toFixed(1)} mBTC`
      }
      return `${priceBtc.toFixed(2)} BTC`
    }
    return `${new Intl.NumberFormat("en-US").format(Math.round(priceUsdt))} USDT`
  }

  const getPriceValue = (priceBtc: number, priceUsdt: number): number => {
    return currency === "BTC" ? priceBtc : priceUsdt
  }

  const getCurrencySymbol = (): string => {
    return currency === "BTC" ? "₿" : "$"
  }

  const getCurrencyColor = (): string => {
    return currency === "BTC" ? "#F7931A" : "#26A17B"
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        getPriceValue,
        getCurrencySymbol,
        getCurrencyColor,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
