"use client"

import { useState, useCallback, useEffect } from "react"
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
  ShieldCheck,
  ShieldX,
  Database,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  detectedCountry?: string
  // Multi-provider fields
  source?: string
  providersTried?: string[]
  isVerified?: boolean
  verificationStatus?: string
  isDeliverable?: boolean
}

interface ProviderConfig {
  configured: boolean
  name: string
  description: string
}

interface ProvidersInfo {
  providers: Record<string, ProviderConfig>
  canVerify: boolean
}

const COUNTRY_FLAGS: Record<string, string> = {
  QA: "🇶🇦 Qatar",
  AE: "🇦🇪 UAE",
  SA: "🇸🇦 Saudi",
  BH: "🇧🇭 Bahrain",
  KW: "🇰🇼 Kuwait",
  OM: "🇴🇲 Oman",
  Unknown: "🌍 Unknown",
}

interface EnrichmentResult {
  success: boolean
  stats: {
    total: number
    enriched: number
    verified?: number
    failed: number
    noMatch: number
    undeliverable?: number
    successRate: string
    byProvider?: Record<string, number>
  }
  configuredProviders?: Record<string, boolean>
  results: EnrichedContact[]
}

const PROVIDER_COLORS: Record<string, string> = {
  pdl: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  apollo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  hunter: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

const PROVIDER_NAMES: Record<string, string> = {
  pdl: "PDL",
  apollo: "Apollo",
  hunter: "Hunter",
}

export default function EnrichmentPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<EnrichmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [providersInfo, setProvidersInfo] = useState<ProvidersInfo | null>(null)
  const [enabledProviders, setEnabledProviders] = useState<string[]>(["pdl", "apollo", "hunter"])
  const [verifyEmails, setVerifyEmails] = useState(true)

  useEffect(() => {
    // Fetch available providers on mount
    fetch("/api/enrichment")
      .then((res) => res.json())
      .then((data) => {
        setProvidersInfo(data)
        // Only enable configured providers by default
        const configured = Object.entries(data.providers)
          .filter(([, config]) => (config as ProviderConfig).configured)
          .map(([key]) => key)
        setEnabledProviders(configured)
      })
      .catch(() => {})
  }, [])

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
      formData.append("providers", enabledProviders.join(","))
      formData.append("verifyEmails", verifyEmails.toString())

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

    // Create CSV content with new fields
    const headers = [
      "Name",
      "Original_Phone",
      "Normalized_Phone",
      "Country",
      "Email",
      "Email_Source",
      "LinkedIn_URL",
      "Job_Title",
      "Company",
      "Confidence",
      "Verified",
      "Verification_Status",
      "Deliverable",
      "Status",
    ]

    const rows = result.results.map((r) => [
      r.name,
      r.originalPhone,
      r.phone,
      r.detectedCountry || "",
      r.email || "",
      r.source || "",
      r.linkedinUrl || "",
      r.jobTitle || "",
      r.company || "",
      r.confidence?.toFixed(2) || "",
      r.isVerified ? "Yes" : "No",
      r.verificationStatus || "",
      r.isDeliverable ? "Yes" : "No",
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
                <p className="text-sm font-medium mb-2">CSV Format:</p>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  Name, Phone_Number, Company (optional), Domain (optional)
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Add <strong>Company</strong> or <strong>Domain</strong> columns for better match rates with Apollo/Hunter
                </p>
              </div>

              {/* Provider Selection */}
              {providersInfo && (
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Enrichment Providers
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(providersInfo.providers).map(([key, config]) => (
                      <div
                        key={key}
                        className={`flex items-start gap-2 p-2 rounded-lg border ${
                          config.configured ? "" : "opacity-50"
                        }`}
                      >
                        <Checkbox
                          id={`provider-${key}`}
                          checked={enabledProviders.includes(key)}
                          disabled={!config.configured}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEnabledProviders([...enabledProviders, key])
                            } else {
                              setEnabledProviders(enabledProviders.filter((p) => p !== key))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`provider-${key}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {config.name}
                            {!config.configured && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Not configured
                              </Badge>
                            )}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Email Verification Toggle */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Checkbox
                      id="verify-emails"
                      checked={verifyEmails}
                      disabled={!providersInfo.canVerify}
                      onCheckedChange={(checked) => setVerifyEmails(!!checked)}
                    />
                    <Label htmlFor="verify-emails" className="text-sm cursor-pointer">
                      Verify email deliverability
                      {!providersInfo.canVerify && (
                        <span className="text-muted-foreground ml-1">(requires Hunter API key)</span>
                      )}
                    </Label>
                  </div>
                </div>
              )}

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
                    Processing contacts via {enabledProviders.map(p => PROVIDER_NAMES[p] || p).join(", ")}...
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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">Verified</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">
                    {result.stats.verified || 0}
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
                    {result.stats.failed + (result.stats.undeliverable || 0)}
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

            {/* Provider Breakdown */}
            {result.stats.byProvider && Object.keys(result.stats.byProvider).length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium mb-3">Emails Found By Provider</p>
                  <div className="flex gap-4">
                    {Object.entries(result.stats.byProvider).map(([provider, count]) => (
                      <div key={provider} className="flex items-center gap-2">
                        <Badge className={PROVIDER_COLORS[provider] || "bg-gray-100"}>
                          {PROVIDER_NAMES[provider] || provider}
                        </Badge>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                            <div className="flex items-center gap-2">
                              <span>{contact.phone || contact.originalPhone}</span>
                              {contact.detectedCountry && (
                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {COUNTRY_FLAGS[contact.detectedCountry] || contact.detectedCountry}
                                </span>
                              )}
                            </div>
                            {contact.phone && contact.phone !== contact.originalPhone && (
                              <div className="text-xs text-muted-foreground">
                                was: {contact.originalPhone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.email ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <a
                                        href={`mailto:${contact.email}`}
                                        className="text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Mail className="h-3 w-3" />
                                        {contact.email}
                                      </a>
                                      {contact.isVerified && (
                                        contact.isDeliverable ? (
                                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                          <ShieldX className="h-3.5 w-3.5 text-red-500" />
                                        )
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs space-y-1">
                                      {contact.source && (
                                        <p>Source: <strong>{PROVIDER_NAMES[contact.source] || contact.source}</strong></p>
                                      )}
                                      {contact.isVerified && (
                                        <p>Status: <strong>{contact.verificationStatus}</strong></p>
                                      )}
                                      {contact.confidence && (
                                        <p>Confidence: <strong>{(contact.confidence * 100).toFixed(0)}%</strong></p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                            <div className="flex items-center gap-1">
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
                                <>
                                  <Badge variant="default" className="bg-green-600">
                                    Enriched
                                  </Badge>
                                  {contact.source && (
                                    <Badge className={`text-xs ${PROVIDER_COLORS[contact.source] || "bg-gray-100"}`}>
                                      {PROVIDER_NAMES[contact.source] || contact.source}
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
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
