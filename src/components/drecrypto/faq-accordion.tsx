"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

export interface FAQItem {
  question: string
  answer: string
  category?: string
}

export const FAQ_DATA: FAQItem[] = [
  {
    category: "Legal & Compliance",
    question: "Is buying property with crypto legal in Dubai?",
    answer: "Yes, Dubai has embraced cryptocurrency and is one of the most crypto-friendly real estate markets in the world. The Dubai Land Department (DLD) works with licensed agents to facilitate crypto transactions. All transactions are fully compliant with UAE regulations and recorded on the official property registry."
  },
  {
    category: "Legal & Compliance",
    question: "What cryptocurrencies do you accept?",
    answer: "We accept Bitcoin (BTC), Ethereum (ETH), Tether (USDT), and USD Coin (USDC). Bitcoin and USDT are the most commonly used for real estate transactions due to their stability and liquidity. Contact us if you hold other cryptocurrencies."
  },
  {
    category: "Payment Process",
    question: "How does the payment process work?",
    answer: "1) You select a property and submit an offer. 2) Once accepted, we initiate a secure escrow process. 3) Your crypto is converted to AED at the current market rate through our licensed exchange partners. 4) The seller receives AED, and you receive the property deed. The entire process is transparent and blockchain-verified."
  },
  {
    category: "Payment Process",
    question: "What about price volatility during the transaction?",
    answer: "We use instant settlement to minimize volatility risk. Once you confirm your purchase, the crypto-to-AED conversion happens immediately at the locked rate. For larger transactions, we can also use stablecoins (USDT/USDC) to eliminate volatility entirely."
  },
  {
    category: "Payment Process",
    question: "Do I need to convert crypto to AED before making an offer?",
    answer: "No, you keep your crypto until the deal is finalized. We handle all conversions at the time of closing through licensed exchange partners. You maintain full control of your assets until the moment of transfer."
  },
  {
    category: "Taxes & Fees",
    question: "What are the tax implications?",
    answer: "Dubai has no property tax, capital gains tax, or income tax, making it highly attractive for crypto investors. You may have tax obligations in your home country when disposing of crypto assets—consult a tax advisor familiar with cryptocurrency regulations in your jurisdiction."
  },
  {
    category: "Taxes & Fees",
    question: "What fees apply when buying with crypto?",
    answer: "Standard Dubai property fees apply: 4% DLD registration fee, 2% agency fee, and approximately AED 5,000 in administrative costs. Crypto conversion fees are typically 0.5-1%. There are no additional fees for paying with cryptocurrency."
  },
  {
    category: "Security",
    question: "How is my crypto verified?",
    answer: "We verify your wallet holdings to confirm you have sufficient funds for the purchase. This is done through a secure, read-only connection to your wallet—we never have access to your private keys or ability to move your funds."
  },
  {
    category: "Security",
    question: "Is the transaction secure?",
    answer: "Absolutely. All transactions use licensed escrow services and are recorded on the Dubai Land Department registry. We work with regulated exchange partners for crypto conversions. Smart contracts can be used for additional security and transparency."
  },
  {
    category: "Security",
    question: "How do I verify ownership and avoid fraud?",
    answer: "We conduct full due diligence on every property: title deed verification, no outstanding liens, zoning compliance checks. All properties are verified through the Dubai Land Department. You'll receive official documentation from DLD upon completion."
  },
  {
    category: "Financing",
    question: "Can I get a mortgage if I pay with crypto?",
    answer: "Traditional UAE banks don't currently offer mortgages for crypto purchases. However, you can make a down payment in crypto and finance the remainder conventionally, or use crypto-backed lending platforms. Contact us to discuss hybrid payment options."
  },
  {
    category: "Process",
    question: "Can I buy off-plan properties with crypto?",
    answer: "Yes! Off-plan properties are especially popular with crypto buyers due to their payment plans. You can pay the initial deposit and installments in crypto. This is a great way to invest in Dubai's future developments."
  },
  {
    category: "Process",
    question: "Do sellers accept crypto directly?",
    answer: "Most sellers receive AED through our conversion process, but some developers and private sellers do accept crypto directly. We'll let you know the options for each property. Either way, the process is seamless for you."
  },
  {
    category: "Process",
    question: "How long does the process take?",
    answer: "A crypto property purchase can close in as little as 2-4 weeks—much faster than traditional international transfers. The exact timeline depends on due diligence, seller readiness, and property type (ready vs. off-plan)."
  },
  {
    category: "Process",
    question: "What documents do I need?",
    answer: "You'll need: valid passport, proof of address, source of funds documentation (for AML compliance), and your crypto wallet for verification. For UAE residents, Emirates ID is also required. We guide you through every step."
  },
  {
    category: "International Buyers",
    question: "Can international buyers use crypto?",
    answer: "Absolutely! Dubai is one of the most international-friendly real estate markets. Buyers from any country can purchase property with crypto. No UAE residency or visa is required to own property. We assist clients globally."
  },
  {
    category: "International Buyers",
    question: "What happens if the deal falls through?",
    answer: "If a deal doesn't complete, your crypto is returned to your wallet (minus any applicable cancellation fees as per the agreement). We use escrow protection to ensure your funds are secure throughout the process."
  }
]

interface FAQAccordionProps {
  items?: FAQItem[]
  showCategories?: boolean
}

export function FAQAccordion({ items = FAQ_DATA, showCategories = true }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  // Group by category if showing categories
  const categories = showCategories
    ? Array.from(new Set(items.map(item => item.category).filter(Boolean)))
    : null

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const renderItem = (item: FAQItem, index: number) => (
    <div
      key={index}
      className="border border-white/10 overflow-hidden"
    >
      <button
        onClick={() => toggleItem(index)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium pr-4">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 text-[#C9A962] flex-shrink-0 transition-transform ${
            openIndex === index ? "rotate-180" : ""
          }`}
        />
      </button>
      {openIndex === index && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-white/70 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  )

  if (showCategories && categories) {
    return (
      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-[#C9A962] font-medium mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              {category}
            </h3>
            <div className="space-y-2">
              {items
                .filter(item => item.category === category)
                .map((item, idx) => renderItem(item, items.indexOf(item)))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => renderItem(item, index))}
    </div>
  )
}
