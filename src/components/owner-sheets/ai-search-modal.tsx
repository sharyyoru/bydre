"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Search, Loader2, AlertCircle, Check } from "lucide-react"

type FilterState = {
  area: string | null
  building: string | null
  owner_type: string | null
  nationality: string | null
  duplicatesOnly: boolean
  search: string
}

interface AISearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onApplyFilters: (filters: Partial<FilterState>) => void
}

const SUGGESTIONS = [
  "Find all owners in Dubai Marina",
  "Show Indian owners with email",
  "Search for companies in Downtown",
  "Duplicates in Business Bay",
]

export function AISearchModal({ 
  open, 
  onOpenChange, 
  workspaceId,
  onApplyFilters 
}: AISearchModalProps) {
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [streamText, setStreamText] = useState("")
  const [interpretation, setInterpretation] = useState("")
  const [filters, setFilters] = useState<Partial<FilterState> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"input" | "searching" | "result" | "error">("input")
  
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (open && phase === "input") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, phase])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setStreamText("")
      setInterpretation("")
      setFilters(null)
      setError(null)
      setPhase("input")
      abortRef.current?.abort()
    }
  }, [open])

  const handleSearch = async () => {
    if (!query.trim() || searching) return

    setSearching(true)
    setPhase("searching")
    setStreamText("")
    setError(null)
    setFilters(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/owner-sheets/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, workspaceId, stream: true }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Search failed")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === "chunk") {
              setStreamText(prev => prev + data.text)
            } else if (data.type === "done") {
              setFilters(data.filters)
              setInterpretation(data.interpretation)
              setPhase("result")
            } else if (data.type === "error") {
              throw new Error(data.error)
            }
          } catch (parseErr) {
            if ((parseErr as Error).message) {
              throw parseErr
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setError((err as Error).message || "AI search failed")
      setPhase("error")
    } finally {
      setSearching(false)
    }
  }

  const handleApply = () => {
    if (filters) {
      onApplyFilters(filters)
      onOpenChange(false)
    }
  }

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    // Auto-search after setting suggestion
    setTimeout(() => {
      setQuery(suggestion)
      handleSearch()
    }, 100)
  }

  const formatFilterLabel = (key: string, value: unknown): string => {
    const labels: Record<string, string> = {
      area: "Area",
      building: "Building",
      owner_type: "Type",
      nationality: "Nationality",
      duplicatesOnly: "Duplicates",
      search: "Search",
    }
    if (key === "duplicatesOnly") return "Duplicates Only"
    return `${labels[key] || key}: ${value}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D4AF37]" />
            AI Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={searching}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={!query.trim() || searching}
              className="bg-[#0A1628] hover:bg-[#0A1628]/90"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Suggestions (shown in input phase) */}
          {phase === "input" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Searching Animation */}
          {phase === "searching" && (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-[#D4AF37] animate-pulse" />
                  <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-[#D4AF37]/30 animate-ping" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Understanding your query...
              </p>
              {streamText && (
                <div className="text-xs text-muted-foreground/70 font-mono max-h-20 overflow-hidden">
                  {streamText.slice(0, 100)}...
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {phase === "result" && filters && (
            <div className="space-y-4">
              {/* Interpretation */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <Check className="h-5 w-5 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#0A1628]">
                    {interpretation}
                  </p>
                </div>
              </div>

              {/* Filter Badges */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Filters to apply:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (value === null || value === undefined || value === "" || value === false) return null
                    return (
                      <Badge 
                        key={key} 
                        variant="secondary"
                        className="bg-[#0A1628] text-white"
                      >
                        {formatFilterLabel(key, value)}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleApply}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A1628]"
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPhase("input")
                    setFilters(null)
                    setStreamText("")
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                  {error?.includes("API") && (
                    <p className="text-xs text-red-600 mt-1">
                      Go to Workspace Settings → API Keys to configure Gemini
                    </p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPhase("input")}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
