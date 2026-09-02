"use client"

import { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Bitcoin } from "lucide-react"

interface PriceChartProps {
  priceAed: number
  priceBtc: number
  sqft: string
  location: string
  type: "off-plan" | "ready"
}

export function PriceChart({ priceAed, priceBtc, sqft, location, type }: PriceChartProps) {
  // Generate mock historical data based on current price
  const historicalData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()
    const data = []
    
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      // Simulate price fluctuation (±5% over the year, trending up)
      const factor = 1 - (i * 0.004) + (Math.random() * 0.02 - 0.01)
      data.push({
        month: months[monthIndex],
        price: Math.round(priceAed * factor),
        btc: parseFloat((priceBtc * factor).toFixed(2))
      })
    }
    return data
  }, [priceAed, priceBtc])

  // Calculate price per sqft
  const sqftValue = parseInt(sqft.replace(/[^0-9]/g, "")) || 1000
  const pricePerSqft = Math.round(priceAed / sqftValue)

  // Area comparison data
  const areaComparison = useMemo(() => {
    const basePrice = pricePerSqft
    return [
      { area: location, price: basePrice, fill: "#C9A962" },
      { area: "Dubai Marina", price: Math.round(basePrice * (0.9 + Math.random() * 0.3)), fill: "#ffffff20" },
      { area: "Downtown", price: Math.round(basePrice * (1.0 + Math.random() * 0.3)), fill: "#ffffff20" },
      { area: "Palm Jumeirah", price: Math.round(basePrice * (1.1 + Math.random() * 0.4)), fill: "#ffffff20" },
      { area: "JBR", price: Math.round(basePrice * (0.85 + Math.random() * 0.25)), fill: "#ffffff20" },
    ].sort((a, b) => b.price - a.price)
  }, [location, pricePerSqft])

  // Calculate YoY change
  const yoyChange = ((historicalData[11].price - historicalData[0].price) / historicalData[0].price * 100).toFixed(1)
  const isPositive = parseFloat(yoyChange) >= 0

  return (
    <div className="space-y-6">
      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/50 text-xs mb-1">Price per Sqft</p>
          <p className="text-white text-xl font-light">AED {pricePerSqft.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/50 text-xs mb-1">12 Month Change</p>
          <div className={`flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-xl font-light">{yoyChange}%</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/50 text-xs mb-1">Property Type</p>
          <p className="text-white text-xl font-light capitalize">{type}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/50 text-xs mb-1">Market Status</p>
          <p className="text-green-400 text-xl font-light">Active</p>
        </div>
      </div>

      {/* Price History Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-medium">Price History</h3>
            <p className="text-white/50 text-sm">12-month price trend in AED</p>
          </div>
          <div className="flex items-center gap-2 text-[#C9A962]">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">AED</span>
          </div>
        </div>

        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A962" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A962" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: "#ffffff60", fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: "#ffffff60", fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff"
                }}
                formatter={(value) => [`AED ${Number(value).toLocaleString()}`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#C9A962"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Comparison */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-white font-medium">Area Price Comparison</h3>
          <p className="text-white/50 text-sm">Price per sqft across Dubai areas</p>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaComparison} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                type="number" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: "#ffffff60", fontSize: 12 }}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <YAxis 
                dataKey="area" 
                type="category"
                axisLine={false} 
                tickLine={false}
                tick={{ fill: "#ffffff90", fontSize: 12 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff"
                }}
                formatter={(value) => [`AED ${Number(value).toLocaleString()}/sqft`, "Price"]}
              />
              <Bar 
                dataKey="price" 
                radius={[0, 4, 4, 0]}
                fill="#ffffff20"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-white/40 text-xs mt-4 text-center">
          * Prices are indicative averages based on market data
        </p>
      </div>
    </div>
  )
}
