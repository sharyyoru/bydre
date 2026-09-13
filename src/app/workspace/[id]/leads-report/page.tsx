"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileSpreadsheet,
  BarChart3,
  Table2,
  Bot,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LayoutDashboard
} from "lucide-react"

import {
  KPIGrid,
  LeadFunnelChart,
  AgentLeaderboard,
  AIChatPanel,
  FileUploadZone,
  SmartFilters,
  useFilteredData,
  ColumnFilter,
  DateFilter
} from "@/components/leads-report"

interface SheetData {
  name: string
  headers: string[]
  rows: Record<string, unknown>[]
  summary: {
    totalRows: number
    numericColumns: string[]
    totals: Record<string, number>
  }
}

interface ExcelFile {
  name: string
  sheets: SheetData[]
}

const STATUS_COLORS: Record<string, string> = {
  "Meeting Done": "bg-green-100 text-green-800",
  "Meeting Scheduled": "bg-blue-100 text-blue-800",
  "Interested": "bg-purple-100 text-purple-800",
  "Information Shared": "bg-cyan-100 text-cyan-800",
  "Call Back": "bg-yellow-100 text-yellow-800",
  "Fresh Lead": "bg-indigo-100 text-indigo-800",
  "No Answer/Busy": "bg-orange-100 text-orange-800",
  "Not Qualified": "bg-red-100 text-red-800",
  "Invalid/Wrong Number": "bg-red-100 text-red-800",
  "Switched Off": "bg-gray-100 text-gray-800",
}

export default function LeadsReportPage() {
  const params = useParams()
  const workspaceId = params.id as string

  const [files, setFiles] = useState<ExcelFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [sortColumn, setSortColumn] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showUpload, setShowUpload] = useState(false)
  
  // Smart filter state
  const [filters, setFilters] = useState<{
    columnFilters: ColumnFilter[]
    dateFilter: DateFilter | null
    searchQuery: string
  }>({
    columnFilters: [],
    dateFilter: null,
    searchQuery: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/leads-report")
      const data = await res.json()
      setFiles(data.files || [])
      if (data.files?.length > 0) {
        setSelectedFile(data.files[0].name)
        if (data.files[0].sheets?.length > 0) {
          setSelectedSheet(data.files[0].sheets[0].name)
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentFile = files.find(f => f.name === selectedFile)
  const currentSheet = currentFile?.sheets.find(s => s.name === selectedSheet)

  // Detect date column for filtering
  const dateColumn = currentSheet?.headers.find(h =>
    h.toLowerCase().includes("date") ||
    h.toLowerCase().includes("created") ||
    h.toLowerCase().includes("time")
  )

  // Apply smart filters
  const filteredRows = useFilteredData(
    currentSheet?.rows || [],
    filters,
    dateColumn
  )

  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [filteredRows, sortColumn, sortDirection])

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  function handleFileUploaded(fileData: unknown) {
    const newFile = fileData as ExcelFile
    setFiles(prev => [newFile, ...prev])
    setSelectedFile(newFile.name)
    if (newFile.sheets?.length > 0) {
      setSelectedSheet(newFile.sheets[0].name)
    }
    setShowUpload(false)
  }

  // Prepare data for AI chat
  const aiDataContext = useMemo(() => {
    return files.map(f => ({
      file: f.name,
      sheets: f.sheets.map(s => ({
        name: s.name,
        rowCount: s.summary.totalRows,
        columns: s.headers,
        totals: s.summary.totals,
        sampleRows: s.rows.slice(0, 15)
      }))
    }))
  }, [files])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-7 w-7 text-blue-600" />
              Leads Report Center
            </h1>
            <p className="text-gray-600">
              AI-powered campaign performance and lead analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={showUpload ? "default" : "outline"}
              onClick={() => setShowUpload(!showUpload)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>

            <Select value={selectedFile} onValueChange={(v) => {
              setSelectedFile(v)
              const file = files.find(f => f.name === v)
              if (file?.sheets[0]) setSelectedSheet(file.sheets[0].name)
            }}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select file" />
              </SelectTrigger>
              <SelectContent>
                {files.map(f => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name.replace(".xlsx", "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        {showUpload && (
          <div className="mb-6">
            <FileUploadZone
              workspaceId={workspaceId}
              onFileUploaded={handleFileUploaded}
            />
          </div>
        )}

        {/* KPI Grid */}
        {currentSheet && (
          <div className="mb-6">
            <KPIGrid totals={currentSheet.summary.totals} />
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Analyst
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Table2 className="h-4 w-4" />
              Data Table
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funnel Chart */}
              {currentSheet && (
                <LeadFunnelChart data={currentSheet.summary.totals} />
              )}

              {/* Agent Leaderboard */}
              {currentSheet && (
                <AgentLeaderboard
                  rows={currentSheet.rows}
                  headers={currentSheet.headers}
                />
              )}

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Status Distribution
                  </CardTitle>
                  <CardDescription>Lead status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentSheet?.summary.numericColumns
                      .filter(col => !col.includes("Count") && !col.includes("Ref"))
                      .slice(0, 10)
                      .map(status => {
                        const value = currentSheet.summary.totals[status] || 0
                        const totalLeads = currentSheet.summary.totals["Lead Ref No. Count"] ||
                          currentSheet.summary.totals["Lead Ref No.\nCount"] || 1
                        const percentage = ((value / totalLeads) * 100).toFixed(1)

                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{status}</span>
                              <span className="text-gray-600">{value.toLocaleString()} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* File Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Loaded Files</CardTitle>
                  <CardDescription>
                    {files.length} file(s) • {files.reduce((sum, f) =>
                      sum + f.sheets.reduce((s, sh) => s + sh.summary.totalRows, 0), 0
                    ).toLocaleString()} total rows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {files.map(file => (
                      <div
                        key={file.name}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedFile === file.name
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                          }`}
                        onClick={() => {
                          setSelectedFile(file.name)
                          if (file.sheets[0]) setSelectedSheet(file.sheets[0].name)
                        }}
                      >
                        <p className="font-medium text-sm truncate">{file.name.replace(".xlsx", "")}</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {file.sheets.reduce((sum, s) => sum + s.summary.totalRows, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{file.sheets.length} sheet(s)</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Analyst Tab */}
          <TabsContent value="ai">
            <AIChatPanel
              workspaceId={workspaceId}
              data={aiDataContext}
              context={`Current file: ${selectedFile}, Current sheet: ${selectedSheet}`}
            />
          </TabsContent>

          {/* Data Table Tab */}
          <TabsContent value="data">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select sheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentFile?.sheets.map(s => (
                          <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Badge variant="outline">
                    {sortedRows.length} of {currentSheet?.rows.length || 0} rows
                  </Badge>
                </div>

                {/* Smart Filters */}
                {currentSheet && (
                  <SmartFilters
                    headers={currentSheet.headers}
                    rows={currentSheet.rows}
                    dateColumn={dateColumn}
                    onFiltersChange={setFilters}
                  />
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        {currentSheet?.headers.map(header => (
                          <th
                            key={header}
                            className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort(header)}
                          >
                            <div className="flex items-center gap-1">
                              {header}
                              {sortColumn === header && (
                                sortDirection === "asc"
                                  ? <ChevronUp className="h-4 w-4" />
                                  : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          {currentSheet?.headers.map(header => {
                            const value = row[header]
                            const isStatus = STATUS_COLORS[header]
                            return (
                              <td key={header} className="px-4 py-3">
                                {typeof value === "number" ? (
                                  <span className="font-mono">{value.toLocaleString()}</span>
                                ) : isStatus && value ? (
                                  <Badge className={STATUS_COLORS[header]}>{String(value)}</Badge>
                                ) : (
                                  String(value || "-")
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                    {currentSheet && currentSheet.summary.numericColumns.length > 0 && (
                      <tfoot>
                        <tr className="bg-blue-50 font-bold">
                          {currentSheet.headers.map((header, i) => (
                            <td key={header} className="px-4 py-3">
                              {i === 0 ? "TOTALS" : currentSheet.summary.totals[header]?.toLocaleString() || ""}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                {sortedRows.length > 100 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Showing first 100 of {sortedRows.length} rows
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
