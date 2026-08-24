"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Image as ImageIcon, 
  FileText,
  Download,
  Search,
  Star,
  DollarSign,
  Globe,
  ChevronRight,
  Sparkles,
  Building2
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  country: string | null
  total_spend: number
  transaction_count: number
  wealth_score: number
  re_potential_score: number
  engagement_score: number
  chat_sessions: number
  status: string
  tags: string[]
  created_at: string
}

interface Stats {
  totalLeads: number
  avgWealthScore: number
  avgPotentialScore: number
  highPotentialCount: number
  totalSpend: number
  qualifiedCount: number
}

const STATUS_COLORS: Record<string, string> = {
  imported: "bg-gray-100 text-gray-800",
  scored: "bg-blue-100 text-blue-800",
  engaged: "bg-purple-100 text-purple-800",
  qualified: "bg-green-100 text-green-800",
  contacted: "bg-orange-100 text-orange-800",
  converted: "bg-emerald-100 text-emerald-800",
}

// Generate likely search keywords based on wealth profile
function generateKeywords(lead: Lead): { term: string; category: "crypto" | "tax" | "wealth" | "property" }[] {
  const keywords: { term: string; category: "crypto" | "tax" | "wealth" | "property" }[] = []
  const spend = lead.total_spend
  const score = lead.wealth_score
  
  // High spenders - likely interested in wealth preservation
  if (spend > 50000) {
    keywords.push({ term: "Swiss private banking", category: "wealth" })
    keywords.push({ term: "wealth management Switzerland", category: "wealth" })
    keywords.push({ term: "family office Zurich", category: "wealth" })
  }
  
  if (spend > 30000) {
    keywords.push({ term: "forfait fiscal Switzerland", category: "tax" })
    keywords.push({ term: "Swiss tax residency", category: "tax" })
    keywords.push({ term: "lump sum taxation", category: "tax" })
  }
  
  if (spend > 20000) {
    keywords.push({ term: "crypto custody Switzerland", category: "crypto" })
    keywords.push({ term: "Zug crypto valley", category: "crypto" })
    keywords.push({ term: "Swiss bank account foreigner", category: "wealth" })
  }
  
  // Based on score tiers
  if (score >= 70) {
    keywords.push({ term: "buy property Switzerland", category: "property" })
    keywords.push({ term: "Swiss real estate investment", category: "property" })
    keywords.push({ term: "Geneva luxury apartments", category: "property" })
    keywords.push({ term: "Lex Koller permit", category: "property" })
  } else if (score >= 50) {
    keywords.push({ term: "relocate to Switzerland", category: "tax" })
    keywords.push({ term: "Swiss B permit", category: "tax" })
    keywords.push({ term: "invest in Switzerland", category: "wealth" })
  } else if (score >= 30) {
    keywords.push({ term: "Swiss investment opportunities", category: "wealth" })
    keywords.push({ term: "offshore banking", category: "wealth" })
    keywords.push({ term: "tax optimization Europe", category: "tax" })
  }
  
  // International indicators from phone/email
  if (lead.phone?.startsWith("+33")) {
    keywords.push({ term: "immobilier Suisse français", category: "property" })
  }
  if (lead.phone?.startsWith("+7") || lead.phone?.startsWith("+971")) {
    keywords.push({ term: "Swiss golden visa", category: "tax" })
    keywords.push({ term: "Dubai to Switzerland relocation", category: "tax" })
  }
  if (lead.email?.includes(".ru") || lead.phone?.startsWith("+7")) {
    keywords.push({ term: "Switzerland residency CIS", category: "tax" })
  }
  
  // Dedupe and limit
  const unique = keywords.filter((k, i, arr) => 
    arr.findIndex(x => x.term === k.term) === i
  )
  
  return unique.slice(0, 6)
}

const KEYWORD_COLORS = {
  crypto: "bg-blue-50 text-blue-700 border-blue-200",
  tax: "bg-green-50 text-green-700 border-green-200",
  wealth: "bg-amber-50 text-amber-700 border-amber-200",
  property: "bg-purple-50 text-purple-700 border-purple-200",
}

export default function AdSimulationPage() {
  const params = useParams()
  const workspaceId = params.id as string
  const supabase = createClient()

  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterScore, setFilterScore] = useState<number | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [workspaceId])

  async function fetchLeads() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from("ad_simulation_leads")
      .select("*")
      .order("re_potential_score", { ascending: false })
    
    if (error) {
      console.error("Error fetching leads:", error)
      setLoading(false)
      return
    }
    
    setLeads(data || [])
    
    // Calculate stats
    if (data && data.length > 0) {
      const totalSpend = data.reduce((sum, l) => sum + (l.total_spend || 0), 0)
      const avgWealth = data.reduce((sum, l) => sum + (l.wealth_score || 0), 0) / data.length
      const avgPotential = data.reduce((sum, l) => sum + (l.re_potential_score || 0), 0) / data.length
      const highPotential = data.filter(l => (l.re_potential_score || 0) >= 70).length
      const qualified = data.filter(l => l.status === "qualified" || l.status === "contacted" || l.status === "converted").length
      
      setStats({
        totalLeads: data.length,
        avgWealthScore: avgWealth,
        avgPotentialScore: avgPotential,
        highPotentialCount: highPotential,
        totalSpend: totalSpend,
        qualifiedCount: qualified,
      })
    }
    
    setLoading(false)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesScore = filterScore === null || lead.re_potential_score >= filterScore
    
    return matchesSearch && matchesScore
  })

  async function exportLeads() {
    // Export all filtered leads (not just 70+ score)
    const toExport = filteredLeads.length > 0 ? filteredLeads : leads
    
    const csv = [
      ["Name", "Email", "Phone", "Total Spend (CHF)", "Wealth Score", "RE Potential Score", "Status", "Keywords (Crypto)", "Keywords (Tax)", "Keywords (Wealth)", "Keywords (Property)", "All Keywords"].join(","),
      ...toExport.map(l => {
        const keywords = generateKeywords(l)
        const cryptoKw = keywords.filter(k => k.category === "crypto").map(k => k.term).join("; ")
        const taxKw = keywords.filter(k => k.category === "tax").map(k => k.term).join("; ")
        const wealthKw = keywords.filter(k => k.category === "wealth").map(k => k.term).join("; ")
        const propertyKw = keywords.filter(k => k.category === "property").map(k => k.term).join("; ")
        const allKw = keywords.map(k => k.term).join("; ")
        
        return [
          `"${l.name}"`,
          l.email || "",
          l.phone || "",
          l.total_spend,
          l.wealth_score,
          l.re_potential_score,
          l.status,
          `"${cryptoKw}"`,
          `"${taxKw}"`,
          `"${wealthKw}"`,
          `"${propertyKw}"`,
          `"${allKw}"`
        ].join(",")
      })
    ].join("\n")
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `re_qualified_leads_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-gray-500"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              Ad Simulation
            </h1>
            <p className="text-gray-600 mt-1">
              Swiss investment ads to qualify real estate prospects
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={exportLeads}>
              <Download className="h-4 w-4 mr-2" />
              Export Qualified
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Leads</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.totalLeads}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Total Spend</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  CHF {(stats.totalSpend / 1000).toFixed(0)}k
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Avg Wealth</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.avgWealthScore.toFixed(0)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-gray-600">RE Potential</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.avgPotentialScore.toFixed(0)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">High Potential</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.highPotentialCount}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-600" />
                  <span className="text-sm text-gray-600">Qualified</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.qualifiedCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/workspace/${workspaceId}/ad-simulation/mockups`}>
            <Card className="hover:border-purple-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ImageIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Ad Mockups</h3>
                      <p className="text-sm text-gray-600">Preview Meta & Google ads</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href={`/workspace/${workspaceId}/ad-simulation/chat`}>
            <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Chatbot</h3>
                      <p className="text-sm text-gray-600">Investment advisor simulation</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href={`/workspace/${workspaceId}/ad-simulation/landing`}>
            <Card className="hover:border-green-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Landing Pages</h3>
                      <p className="text-sm text-gray-600">Lead capture funnels</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lead Qualification</CardTitle>
                <CardDescription>
                  Premium clinic patients scored for real estate investment potential
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                
                <select 
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filterScore ?? ""}
                  onChange={(e) => setFilterScore(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Scores</option>
                  <option value="80">80+ (Hot)</option>
                  <option value="60">60+ (Warm)</option>
                  <option value="40">40+ (Cold)</option>
                </select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-10">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No leads found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Import leads from aesthetic clinic to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead className="text-center">Wealth Score</TableHead>
                    <TableHead className="text-center">RE Potential</TableHead>
                    <TableHead>Likely Search Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-gray-500">
                            {lead.transaction_count} transactions
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lead.email && <p className="text-gray-600">{lead.email}</p>}
                          {lead.phone && <p className="text-gray-500 text-xs">{lead.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        CHF {lead.total_spend.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={lead.wealth_score} className="w-16 h-2" />
                          <span className={`text-sm font-medium ${getScoreColor(lead.wealth_score)}`}>
                            {lead.wealth_score}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={lead.re_potential_score} className="w-16 h-2" />
                          <span className={`text-sm font-bold ${getScoreColor(lead.re_potential_score)}`}>
                            {lead.re_potential_score}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {generateKeywords(lead).slice(0, 3).map((kw, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border cursor-help ${KEYWORD_COLORS[kw.category]}`}>
                                    {kw.term.length > 20 ? kw.term.slice(0, 18) + "..." : kw.term}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{kw.term}</p>
                                  <p className="text-[10px] text-gray-400 capitalize">{kw.category} interest</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {generateKeywords(lead).length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200 cursor-help">
                                    +{generateKeywords(lead).length - 3} more
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    {generateKeywords(lead).slice(3).map((kw, i) => (
                                      <p key={i} className="text-xs">{kw.term}</p>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[lead.status] || "bg-gray-100"}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/workspace/${workspaceId}/ad-simulation/chat?lead=${lead.id}`}>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
