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
    const qualified = leads.filter(l => l.re_potential_score >= 70)
    
    const csv = [
      ["Name", "Email", "Phone", "Total Spend (CHF)", "Wealth Score", "RE Potential Score", "Status"].join(","),
      ...qualified.map(l => [
        `"${l.name}"`,
        l.email || "",
        l.phone || "",
        l.total_spend,
        l.wealth_score,
        l.re_potential_score,
        l.status
      ].join(","))
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
