"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
  Users,
  Mail,
  Linkedin,
  Building2,
  Briefcase,
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface EnrichedContact {
  name: string
  phone: string
  originalPhone: string
  email: string | null
  linkedinUrl: string | null
  jobTitle: string | null
  company: string | null
  confidence: number | null
  error: string | null
}

interface EnrichmentResult {
  success: boolean
  stats: {
    total: number
    enriched: number
    failed: number
    noMatch: number
    successRate: string
  }
  results: EnrichedContact[]
}

export default function EnrichmentPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<EnrichmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (csvFile) {
      setFile(csvFile)
      setResult(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  })

  const handleEnrich = async () => {
    if (!file) return

    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/enrichment", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Enrichment failed")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    // Create CSV content
    const headers = [
      "Name",
      "Original_Phone",
      "Normalized_Phone",
      "Email",
      "LinkedIn_URL",
      "Job_Title",
      "Company",
      "Confidence",
      "Status",
    ]

    const rows = result.results.map((r) => [
      r.name,
      r.originalPhone,
      r.phone,
      r.email || "",
      r.linkedinUrl || "",
      r.jobTitle || "",
      r.company || "",
      r.confidence?.toFixed(2) || "",
      r.error || "Enriched",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `enriched_contacts_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contact Enrichment</h1>
            <p className="text-muted-foreground">
              Upload a CSV with Name and Phone to get Email, LinkedIn, Job Title & Company
            </p>
          </div>
          {result && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                New Upload
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </Button>
            </div>
          )}
        </div>

        {/* Upload Section */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Contacts CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
                  ${file ? "border-green-500 bg-green-500/5" : ""}
                `}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-12 w-12 text-green-500" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">
                      {isDragActive ? "Drop your CSV here" : "Drag & drop your CSV file"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                )}
              </div>

              {/* CSV Format Help */}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Required CSV Format:</p>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  Name, Phone_Number
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Phone numbers will be automatically normalized (e.g., 050 123 4567 → +971501234567)
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Enrich Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!file || processing}
                onClick={handleEnrich}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriching Contacts...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Start Enrichment
                  </>
                )}
              </Button>

              {processing && (
                <div className="space-y-2">
                  <Progress value={undefined} className="animate-pulse" />
                  <p className="text-sm text-center text-muted-foreground">
                    Processing contacts via People Data Labs API...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {result && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{result.stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">Enriched</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    {result.stats.enriched}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">No Match</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">
                    {result.stats.noMatch}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-muted-foreground">Failed</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {result.stats.failed}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{result.stats.successRate}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle>Enrichment Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>LinkedIn</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.results.map((contact, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {contact.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{contact.phone || contact.originalPhone}</div>
                            {contact.phone && contact.phone !== contact.originalPhone && (
                              <div className="text-xs text-muted-foreground">
                                was: {contact.originalPhone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.email ? (
                              <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.linkedinUrl ? (
                              <a
                                href={contact.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <Linkedin className="h-3 w-3" />
                                Profile
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.jobTitle ? (
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                {contact.jobTitle}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.company ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {contact.company}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.error ? (
                              <Badge
                                variant={
                                  contact.error === "No match found"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {contact.error}
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600">
                                Enriched
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
