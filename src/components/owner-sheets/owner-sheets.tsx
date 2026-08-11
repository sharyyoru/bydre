"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Upload,
  Filter,
  Download,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  FileSpreadsheet,
  Users,
  Copy,
} from "lucide-react"
import { UploadPanel } from "./upload-panel"
import { SearchableSelect } from "./searchable-select"
import { DuplicatePanel } from "./duplicate-panel"
import { AISearchModal } from "./ai-search-modal"

export type OwnerContact = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  property: string | null
  area: string | null
  building: string | null
  unit: string | null
  owner_type: string | null
  nationality: string | null
  language: string | null
  notes: string | null
  last_contact_date: string | null
  source_file: string
  source_folder: string | null
  source_row: number
  is_duplicate: boolean
  duplicate_of: string | null
  duplicate_reason: string | null
  created_at: string
}

type FilterState = {
  area: string | null
  building: string | null
  owner_type: string | null
  nationality: string | null
  duplicatesOnly: boolean
  search: string
}

type FilterOptions = {
  areas: string[]
  buildings: string[]
  owner_types: string[]
  nationalities: string[]
}

export function OwnerSheets() {
  const params = useParams<{ id: string }>()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<OwnerContact[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showUpload, setShowUpload] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState<string | null>(null)
  const [showAiSearch, setShowAiSearch] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState<FilterState>({
    area: null,
    building: null,
    owner_type: null,
    nationality: null,
    duplicatesOnly: false,
    search: "",
  })

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    areas: [],
    buildings: [],
    owner_types: [],
    nationalities: [],
  })

  // Resolve workspace ID and check admin
  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)
      const { data: workspace } = isUuid
        ? await supabase.from("workspaces").select("id").eq("id", params.id).maybeSingle()
        : await supabase.from("workspaces").select("id").eq("slug", params.id).maybeSingle()

      if (!workspace) return

      setWorkspaceId(workspace.id)

      const { data: auth } = await supabase.auth.getUser()
      if (auth.user) {
        const { data: membership } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspace.id)
          .eq("user_id", auth.user.id)
          .maybeSingle()
        setIsAdmin(membership?.role === "admin")
      }
    }
    init()
  }, [params.id])

  // Fetch contacts with filters and pagination
  const fetchContacts = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)

    try {
      const queryParams = new URLSearchParams()
      queryParams.set("workspaceId", workspaceId)
      queryParams.set("page", page.toString())
      queryParams.set("perPage", perPage.toString())
      if (filters.area) queryParams.set("area", filters.area)
      if (filters.building) queryParams.set("building", filters.building)
      if (filters.owner_type) queryParams.set("owner_type", filters.owner_type)
      if (filters.nationality) queryParams.set("nationality", filters.nationality)
      if (filters.duplicatesOnly) queryParams.set("duplicatesOnly", "true")
      if (filters.search) queryParams.set("search", filters.search)

      const res = await fetch(`/api/owner-sheets/contacts?${queryParams}`)
      const data = await res.json()

      if (res.ok) {
        setContacts(data.contacts || [])
        setTotalCount(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setFilterOptions(data.filterOptions || filterOptions)
      } else {
        toast.error(data.error || "Failed to load contacts")
      }
    } catch {
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }, [workspaceId, filters, page, perPage])

  useEffect(() => {
    if (workspaceId) {
      fetchContacts()
    }
  }, [workspaceId, fetchContacts])

  // Handle AI search filter application
  const handleApplyAiFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
    setPage(1) // Reset to first page when applying new filters
    toast.success("AI filters applied")
  }

  // Export to Excel
  const handleExport = async () => {
    if (!workspaceId) return
    setExporting(true)

    try {
      const queryParams = new URLSearchParams()
      queryParams.set("workspaceId", workspaceId)
      if (filters.area) queryParams.set("area", filters.area)
      if (filters.building) queryParams.set("building", filters.building)
      if (filters.owner_type) queryParams.set("owner_type", filters.owner_type)
      if (filters.nationality) queryParams.set("nationality", filters.nationality)
      if (filters.duplicatesOnly) queryParams.set("duplicatesOnly", "true")
      if (filters.search) queryParams.set("search", filters.search)
      if (selectedIds.size > 0) {
        queryParams.set("ids", Array.from(selectedIds).join(","))
      }

      const res = await fetch(`/api/owner-sheets/export?${queryParams}`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `owner-contacts-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        toast.success("Export downloaded")
      } else {
        const data = await res.json()
        toast.error(data.error || "Export failed")
      }
    } catch {
      toast.error("Export failed")
    } finally {
      setExporting(false)
    }
  }

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    }
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({
      area: null,
      building: null,
      owner_type: null,
      nationality: null,
      duplicatesOnly: false,
      search: "",
    })
    setPage(1)
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">
              Only workspace admins can access Owner Sheets.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Owner Sheets</h1>
          <p className="text-sm text-muted-foreground">
            Upload, unify, and manage owner contact data from multiple Excel files
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-[#0A1628]">
          <Upload className="h-4 w-4 mr-2" />
          Upload Zip
        </Button>
      </div>

      {/* AI Search Button */}
      <Button 
        onClick={() => setShowAiSearch(true)} 
        variant="outline"
        className="w-full justify-start gap-2 border-dashed border-[#D4AF37]/50 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5"
      >
        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
        <span className="text-muted-foreground">AI Search: &quot;Find all owners in Dubai Marina&quot; ...</span>
      </Button>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <SearchableSelect
              placeholder="Area"
              options={filterOptions.areas}
              value={filters.area}
              onChange={(v: string | null) => { setFilters((f) => ({ ...f, area: v })); setPage(1) }}
            />
            <SearchableSelect
              placeholder="Building"
              options={filterOptions.buildings}
              value={filters.building}
              onChange={(v: string | null) => { setFilters((f) => ({ ...f, building: v })); setPage(1) }}
            />
            <SearchableSelect
              placeholder="Owner Type"
              options={filterOptions.owner_types}
              value={filters.owner_type}
              onChange={(v: string | null) => { setFilters((f) => ({ ...f, owner_type: v })); setPage(1) }}
            />
            <SearchableSelect
              placeholder="Nationality"
              options={filterOptions.nationalities}
              value={filters.nationality}
              onChange={(v: string | null) => { setFilters((f) => ({ ...f, nationality: v })); setPage(1) }}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="duplicates"
                checked={filters.duplicatesOnly}
                onCheckedChange={(c) => { setFilters((f) => ({ ...f, duplicatesOnly: !!c })); setPage(1) }}
              />
              <label htmlFor="duplicates" className="text-sm cursor-pointer">
                Duplicates only
              </label>
            </div>
            <Input
              placeholder="Search name/phone..."
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar with Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Result Counter */}
          <p className="text-sm text-muted-foreground">
            {totalCount > 0 ? (
              <>
                Showing <span className="font-medium text-foreground">{((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalCount)}</span> of <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> contacts
              </>
            ) : (
              "No contacts"
            )}
            {selectedIds.size > 0 && <span className="text-[#D4AF37]"> · {selectedIds.size} selected</span>}
          </p>
          
          {selectedIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export selected
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(Number(v)); setPage(1) }}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No contacts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a zip file containing Excel sheets to get started
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Zip
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === contacts.length && contacts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className={contact.is_duplicate ? "bg-yellow-50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onCheckedChange={() => toggleSelect(contact.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {contact.is_duplicate && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          {contact.name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <div className="flex items-center gap-1">
                            <span>{contact.phone}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(contact.phone!)
                                toast.success("Phone copied")
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{contact.email || "—"}</TableCell>
                      <TableCell>{contact.property || "—"}</TableCell>
                      <TableCell>{contact.area || "—"}</TableCell>
                      <TableCell>{contact.building || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {contact.source_file}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contact.is_duplicate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowDuplicates(contact.id)}
                            title="View duplicates"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Panel */}
      {showUpload && (
        <UploadPanel
          workspaceId={workspaceId!}
          onClose={() => setShowUpload(false)}
          onComplete={() => {
            setShowUpload(false)
            fetchContacts()
          }}
        />
      )}

      {/* Duplicate Panel */}
      {showDuplicates && (
        <DuplicatePanel
          contactId={showDuplicates}
          workspaceId={workspaceId!}
          onClose={() => setShowDuplicates(null)}
          onMerge={() => {
            setShowDuplicates(null)
            fetchContacts()
          }}
        />
      )}

      {/* AI Search Modal */}
      {workspaceId && (
        <AISearchModal
          open={showAiSearch}
          onOpenChange={setShowAiSearch}
          workspaceId={workspaceId}
          onApplyFilters={handleApplyAiFilters}
        />
      )}
    </div>
  )
}
