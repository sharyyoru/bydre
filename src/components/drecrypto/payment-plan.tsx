"use client"

import { useMemo } from "react"
import { Check, Clock, Calendar, Wallet } from "lucide-react"

interface PaymentPlanProps {
  priceAed: number
  priceBtc: number
  handover: string | null
  type: "off-plan" | "ready"
}

interface PaymentMilestone {
  label: string
  percentage: number
  amount: number
  btcAmount: number
  date: string
  status: "completed" | "current" | "upcoming"
}

export function PaymentPlan({ priceAed, priceBtc, handover, type }: PaymentPlanProps) {
  const formatAed = (price: number) => new Intl.NumberFormat("en-AE").format(price)
  const formatBtc = (btc: number) => {
    if (btc < 1) return `${(btc * 1000).toFixed(1)} mBTC`
    return `${btc.toFixed(2)} BTC`
  }

  const milestones = useMemo((): PaymentMilestone[] => {
    if (type === "ready") {
      // Ready property - simple payment structure
      return [
        {
          label: "Booking Deposit",
          percentage: 10,
          amount: priceAed * 0.1,
          btcAmount: priceBtc * 0.1,
          date: "On booking",
          status: "current"
        },
        {
          label: "Balance Payment",
          percentage: 90,
          amount: priceAed * 0.9,
          btcAmount: priceBtc * 0.9,
          date: "Within 30 days",
          status: "upcoming"
        }
      ]
    }

    // Off-plan - structured payment plan
    const handoverDate = handover ? new Date(handover) : new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000)
    const monthsToHandover = Math.max(6, Math.ceil((handoverDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))

    const plan: PaymentMilestone[] = [
      {
        label: "Booking Deposit",
        percentage: 10,
        amount: priceAed * 0.1,
        btcAmount: priceBtc * 0.1,
        date: "On booking",
        status: "current"
      },
      {
        label: "DLD Fee + Admin",
        percentage: 4,
        amount: priceAed * 0.04,
        btcAmount: priceBtc * 0.04,
        date: "Within 30 days",
        status: "upcoming"
      },
      {
        label: "First Installment",
        percentage: 10,
        amount: priceAed * 0.1,
        btcAmount: priceBtc * 0.1,
        date: "3 months",
        status: "upcoming"
      },
      {
        label: "Construction Progress",
        percentage: 36,
        amount: priceAed * 0.36,
        btcAmount: priceBtc * 0.36,
        date: `Over ${Math.round(monthsToHandover * 0.6)} months`,
        status: "upcoming"
      },
      {
        label: "On Handover",
        percentage: 40,
        amount: priceAed * 0.4,
        btcAmount: priceBtc * 0.4,
        date: handover ? new Date(handover).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "TBA",
        status: "upcoming"
      }
    ]

    return plan
  }, [priceAed, priceBtc, handover, type])

  const totalPaid = milestones.filter(m => m.status === "completed").reduce((sum, m) => sum + m.percentage, 0)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-medium flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#C9A962]" />
            Payment Plan
          </h3>
          <p className="text-white/50 text-sm">{type === "off-plan" ? "Flexible installments" : "Ready to move"}</p>
        </div>
        {type === "off-plan" && handover && (
          <div className="text-right">
            <p className="text-white/50 text-xs">Handover</p>
            <p className="text-[#C9A962] font-medium">
              {new Date(handover).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">Payment Progress</span>
          <span className="text-[#C9A962]">{totalPaid}% paid</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#C9A962] rounded-full transition-all duration-500"
            style={{ width: `${totalPaid}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={index} className="relative">
            {/* Connection Line */}
            {index < milestones.length - 1 && (
              <div className="absolute left-[15px] top-[30px] w-0.5 h-[calc(100%+8px)] bg-white/10" />
            )}

            <div className="flex gap-4">
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                milestone.status === "completed" 
                  ? "bg-green-500/20 text-green-400"
                  : milestone.status === "current"
                  ? "bg-[#C9A962]/20 text-[#C9A962] ring-2 ring-[#C9A962]/50"
                  : "bg-white/10 text-white/40"
              }`}>
                {milestone.status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : milestone.status === "current" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-medium ${
                      milestone.status === "completed" 
                        ? "text-green-400"
                        : milestone.status === "current"
                        ? "text-white"
                        : "text-white/70"
                    }`}>
                      {milestone.label}
                    </p>
                    <p className="text-white/50 text-sm">{milestone.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{milestone.percentage}%</p>
                    <p className="text-white/50 text-sm">AED {formatAed(milestone.amount)}</p>
                    <p className="text-[#F7931A] text-xs">{formatBtc(milestone.btcAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/50 text-sm">Total Price</p>
            <p className="text-white text-xl font-light">AED {formatAed(priceAed)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-sm">In Bitcoin</p>
            <p className="text-[#F7931A] text-xl font-light">{formatBtc(priceBtc)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
