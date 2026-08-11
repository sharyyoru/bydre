"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { SalesOpportunity } from "@/lib/sales-brain/types"

interface OpportunityCardProps {
  opportunity: SalesOpportunity
  featured?: boolean
}

export function OpportunityCard({ opportunity, featured = false }: OpportunityCardProps) {
  const scoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50"
    if (score >= 50) return "text-yellow-600 bg-yellow-50"
    return "text-orange-600 bg-orange-50"
  }

  if (featured) {
    return (
      <Card className="overflow-hidden border-2 border-[#D4AF37]/30 bg-gradient-to-br from-white to-[#D4AF37]/5">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Project Info */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0A1628]">
                    {opportunity.project_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {opportunity.developer_name || "Developer TBD"}
                  </p>
                </div>
                <Badge className={`text-lg px-3 py-1 ${scoreColor(opportunity.overall_score)}`}>
                  {opportunity.overall_score}
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Velocity</p>
                    <p className="font-semibold">{opportunity.velocity_score || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="font-semibold">
                      {opportunity.effective_commission_pct 
                        ? `${opportunity.effective_commission_pct}%` 
                        : "TBD"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Inventory</p>
                    <p className="font-semibold">
                      {opportunity.inventory_remaining_pct?.toFixed(0) || "—"}% left
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sales/Day</p>
                    <p className="font-semibold">
                      {opportunity.daily_sales_rate?.toFixed(1) || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              {opportunity.reasoning && (
                <div className="bg-[#0A1628] text-white rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    <span className="text-sm font-medium text-[#D4AF37]">Why Sell This</span>
                  </div>
                  <p className="text-sm text-white/90">{opportunity.reasoning}</p>
                </div>
              )}

              {/* Selling Points */}
              {opportunity.key_selling_points?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    KEY SELLING POINTS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.key_selling_points.map((point, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Buyer */}
              {opportunity.target_buyer_profile && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Target: </span>
                  <span className="font-medium">{opportunity.target_buyer_profile}</span>
                </div>
              )}
            </div>

            {/* Right: Action */}
            <div className="lg:w-48 p-6 bg-gradient-to-br from-[#0A1628] to-[#1a2942] flex flex-col justify-center items-center text-white">
              <p className="text-sm text-white/70 mb-2">Days to Sellout</p>
              <p className="text-4xl font-bold mb-4">
                {opportunity.days_to_sellout || "∞"}
              </p>
              <Button className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black">
                View Project
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Non-featured compact card
  return (
    <Card className="hover:border-[#D4AF37]/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                #{opportunity.rank}
              </Badge>
              <h4 className="font-semibold text-sm">{opportunity.project_name}</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              {opportunity.developer_name || "Developer TBD"}
            </p>
          </div>
          <Badge className={`text-sm ${scoreColor(opportunity.overall_score)}`}>
            {opportunity.overall_score}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <p className="text-lg font-bold">{opportunity.velocity_score || 0}</p>
            <p className="text-xs text-muted-foreground">Velocity</p>
          </div>
          <div>
            <p className="text-lg font-bold">
              {opportunity.effective_commission_pct 
                ? `${opportunity.effective_commission_pct}%` 
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Commission</p>
          </div>
          <div>
            <p className="text-lg font-bold">
              {opportunity.inventory_remaining_pct?.toFixed(0) || "—"}%
            </p>
            <p className="text-xs text-muted-foreground">Left</p>
          </div>
        </div>

        {opportunity.reasoning && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {opportunity.reasoning}
          </p>
        )}

        <Button variant="ghost" size="sm" className="w-full">
          Details <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
