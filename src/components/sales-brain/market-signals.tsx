"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Newspaper,
  MessageCircle,
  Search,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { MarketSignal } from "@/lib/sales-brain/types"
import { toast } from "sonner"

interface MarketSignalsProps {
  workspaceId: string
  signals: MarketSignal[]
}

export function MarketSignals({ workspaceId, signals }: MarketSignalsProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/sales-brain/signals/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      if (res.ok) {
        toast.success("Fetching latest market signals...")
        // Parent will refresh
      } else {
        toast.error("Failed to refresh signals")
      }
    } catch {
      toast.error("Failed to refresh signals")
    } finally {
      setRefreshing(false)
    }
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "launch":
        return <Zap className="h-4 w-4 text-purple-500" />
      case "trend":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "news":
        return <Newspaper className="h-4 w-4 text-blue-500" />
      case "social":
        return <MessageCircle className="h-4 w-4 text-pink-500" />
      default:
        return <Search className="h-4 w-4 text-gray-500" />
    }
  }

  const getSignalBadge = (type: string) => {
    const styles: Record<string, string> = {
      launch: "bg-purple-100 text-purple-700",
      trend: "bg-green-100 text-green-700",
      news: "bg-blue-100 text-blue-700",
      social: "bg-pink-100 text-pink-700",
      price_change: "bg-orange-100 text-orange-700",
    }
    return styles[type] || "bg-gray-100 text-gray-700"
  }

  const getSentimentIcon = (sentiment: string | null) => {
    if (sentiment === "positive") return <TrendingUp className="h-3 w-3 text-green-500" />
    if (sentiment === "negative") return <TrendingDown className="h-3 w-3 text-red-500" />
    return null
  }

  const groupedSignals = signals.reduce((acc, signal) => {
    const type = signal.signal_type
    if (!acc[type]) acc[type] = []
    acc[type].push(signal)
    return acc
  }, {} as Record<string, MarketSignal[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Market Signals</h3>
          <p className="text-sm text-muted-foreground">
            Real-time signals from news, social media, and search trends
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {signals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No signals detected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Market signals will appear here when news, launches, or trends are detected.
            </p>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Fetch Latest Signals
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Launches & Announcements */}
          {groupedSignals.launch && groupedSignals.launch.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  New Launches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSignals.launch.slice(0, 5).map((signal) => (
                  <SignalItem key={signal.id} signal={signal} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Trending Topics */}
          {groupedSignals.trend && groupedSignals.trend.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Trending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSignals.trend.slice(0, 5).map((signal) => (
                  <SignalItem key={signal.id} signal={signal} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* News */}
          {groupedSignals.news && groupedSignals.news.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-blue-500" />
                  Industry News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSignals.news.slice(0, 5).map((signal) => (
                  <SignalItem key={signal.id} signal={signal} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Social Buzz */}
          {groupedSignals.social && groupedSignals.social.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-pink-500" />
                  Social Buzz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSignals.social.slice(0, 5).map((signal) => (
                  <SignalItem key={signal.id} signal={signal} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* All Signals Timeline */}
      {signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signals.slice(0, 10).map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="mt-1">{getSignalIcon(signal.signal_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${getSignalBadge(signal.signal_type)}`}>
                        {signal.signal_type}
                      </Badge>
                      {signal.project_name && (
                        <span className="text-xs text-muted-foreground truncate">
                          {signal.project_name}
                        </span>
                      )}
                      {getSentimentIcon(signal.sentiment)}
                    </div>
                    <p className="text-sm font-medium">{signal.title || "Untitled signal"}</p>
                    {signal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {signal.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{signal.source}</span>
                      <span>•</span>
                      <span>{new Date(signal.signal_date).toLocaleDateString()}</span>
                      {signal.trend_change_pct !== null && (
                        <>
                          <span>•</span>
                          <span className={signal.trend_change_pct > 0 ? "text-green-600" : "text-red-600"}>
                            {signal.trend_change_pct > 0 ? "+" : ""}{signal.trend_change_pct.toFixed(0)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {signal.url && (
                    <Button variant="ghost" size="icon" className="flex-shrink-0" asChild>
                      <a href={signal.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SignalItem({ signal }: { signal: MarketSignal }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{signal.title || signal.project_name || "Signal"}</p>
        <p className="text-xs text-muted-foreground">{signal.source}</p>
      </div>
      {signal.trend_change_pct !== null && (
        <Badge
          variant="secondary"
          className={signal.trend_change_pct > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
        >
          {signal.trend_change_pct > 0 ? "+" : ""}{signal.trend_change_pct.toFixed(0)}%
        </Badge>
      )}
    </div>
  )
}
