"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Bitcoin,
  Building2,
  Wallet,
  Download,
  Calculator,
  FileText,
  CheckCircle2,
  ExternalLink,
  Eye
} from "lucide-react"

interface LandingTemplate {
  id: string
  theme: "crypto" | "tax" | "wealth"
  title: string
  subtitle: string
  leadMagnet: string
  formFields: string[]
  benefits: string[]
  gradient: string
}

const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    id: "crypto-guide",
    theme: "crypto",
    title: "Swiss Crypto Custody Guide",
    subtitle: "The definitive guide to securing your digital assets in Switzerland",
    leadMagnet: "Free 25-page PDF Guide",
    formFields: ["name", "email", "portfolio_size"],
    benefits: [
      "Swiss regulatory framework explained",
      "Top 5 institutional custody providers",
      "Tax implications for crypto holders",
      "Step-by-step setup guide",
    ],
    gradient: "from-blue-600 via-indigo-600 to-purple-700",
  },
  {
    id: "tax-calculator",
    theme: "tax",
    title: "Forfait Fiscal Calculator",
    subtitle: "Estimate your potential tax savings with Swiss lump-sum taxation",
    leadMagnet: "Interactive Tax Calculator",
    formFields: ["name", "email", "current_country", "net_worth"],
    benefits: [
      "Compare your current taxes vs. forfait fiscal",
      "Understand eligibility requirements",
      "See potential annual savings",
      "Get a personalized consultation",
    ],
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
  },
  {
    id: "wealth-comparison",
    theme: "wealth",
    title: "Swiss Private Banking Comparison",
    subtitle: "Compare top Swiss private banks side-by-side",
    leadMagnet: "Exclusive Bank Comparison Report",
    formFields: ["name", "email", "phone", "assets_range"],
    benefits: [
      "Minimum requirements per bank",
      "Fee structures compared",
      "Services & specializations",
      "Direct introductions available",
    ],
    gradient: "from-amber-500 via-orange-600 to-red-600",
  },
]

const THEME_ICONS = {
  crypto: Bitcoin,
  tax: Building2,
  wealth: Wallet,
}

export default function LandingPagesPage() {
  const params = useParams()
  const workspaceId = params.id as string
  
  const [selectedTemplate, setSelectedTemplate] = useState<LandingTemplate | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  
  // Form state for preview
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    portfolio_size: "",
    current_country: "",
    net_worth: "",
    assets_range: "",
    interests: [] as string[],
  })

  function PreviewLanding({ template }: { template: LandingTemplate }) {
    const ThemeIcon = THEME_ICONS[template.theme]
    
    return (
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-lg mx-auto">
        {/* Hero */}
        <div className={`bg-gradient-to-br ${template.gradient} text-white p-8`}>
          <div className="flex items-center gap-2 mb-4">
            <ThemeIcon className="h-6 w-6" />
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {template.theme.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold mb-2">{template.title}</h1>
          <p className="text-white/80">{template.subtitle}</p>
          
          <div className="mt-6 flex items-center gap-2 bg-white/10 rounded-lg p-3">
            <Download className="h-5 w-5" />
            <span className="font-medium">{template.leadMagnet}</span>
          </div>
        </div>
        
        {/* Benefits */}
        <div className="p-6 border-b">
          <h3 className="font-semibold mb-3">What you'll get:</h3>
          <ul className="space-y-2">
            {template.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Form */}
        <div className="p-6">
          <h3 className="font-semibold mb-4">Get instant access:</h3>
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            {template.formFields.includes("phone") && (
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input 
                  id="phone" 
                  placeholder="+41 XX XXX XX XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            )}
            
            {template.formFields.includes("portfolio_size") && (
              <div>
                <Label htmlFor="portfolio">Portfolio Size</Label>
                <select 
                  id="portfolio"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={formData.portfolio_size}
                  onChange={(e) => setFormData({ ...formData, portfolio_size: e.target.value })}
                >
                  <option value="">Select range</option>
                  <option value="100k-500k">CHF 100K - 500K</option>
                  <option value="500k-1m">CHF 500K - 1M</option>
                  <option value="1m-5m">CHF 1M - 5M</option>
                  <option value="5m+">CHF 5M+</option>
                </select>
              </div>
            )}
            
            {template.formFields.includes("assets_range") && (
              <div>
                <Label htmlFor="assets">Total Assets</Label>
                <select 
                  id="assets"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={formData.assets_range}
                  onChange={(e) => setFormData({ ...formData, assets_range: e.target.value })}
                >
                  <option value="">Select range</option>
                  <option value="1m-5m">CHF 1M - 5M</option>
                  <option value="5m-10m">CHF 5M - 10M</option>
                  <option value="10m-50m">CHF 10M - 50M</option>
                  <option value="50m+">CHF 50M+</option>
                </select>
              </div>
            )}
            
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">I'm interested in:</h4>
              <div className="space-y-2">
                {["Crypto custody", "Tax optimization", "Private banking", "Real estate"].map((interest) => (
                  <div key={interest} className="flex items-center gap-2">
                    <Checkbox 
                      id={interest}
                      checked={formData.interests.includes(interest)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, interests: [...formData.interests, interest] })
                        } else {
                          setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) })
                        }
                      }}
                    />
                    <Label htmlFor={interest} className="text-sm font-normal">{interest}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Button className={`w-full bg-gradient-to-r ${template.gradient}`}>
              Get Free Access →
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/workspace/${workspaceId}/ad-simulation`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Landing Page Templates</h1>
              <p className="text-gray-600">
                Lead capture funnels for investment-themed campaigns
              </p>
            </div>
          </div>
        </div>

        {previewMode && selectedTemplate ? (
          /* Preview Mode */
          <div>
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
              <Badge variant="outline" className="text-sm">
                Preview: {selectedTemplate.title}
              </Badge>
            </div>
            
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-xl min-h-[600px] flex items-center justify-center">
              <PreviewLanding template={selectedTemplate} />
            </div>
          </div>
        ) : (
          /* Template Selection */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LANDING_TEMPLATES.map((template) => {
              const ThemeIcon = THEME_ICONS[template.theme]
              
              return (
                <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Preview Header */}
                  <div className={`bg-gradient-to-br ${template.gradient} text-white p-6`}>
                    <div className="flex items-center gap-2 mb-3">
                      <ThemeIcon className="h-5 w-5" />
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                        {template.theme}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold">{template.title}</h3>
                    <p className="text-sm text-white/80 mt-1">{template.subtitle}</p>
                  </div>
                  
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <FileText className="h-4 w-4" />
                      <span>{template.leadMagnet}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                      <p className="font-medium text-gray-700 mb-1">Form fields:</p>
                      <p>{template.formFields.join(", ")}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setPreviewMode(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Strategy Info */}
        {!previewMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Capture Strategy</CardTitle>
              <CardDescription>
                How these landing pages qualify leads for real estate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Bitcoin className="h-5 w-5" />
                    <h4 className="font-medium">Crypto Guide</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Attracts crypto holders seeking Swiss custody. Follow-up discusses 
                    asset diversification → tangible assets → property as hedge.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <Calculator className="h-5 w-5" />
                    <h4 className="font-medium">Tax Calculator</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Qualifies HNWIs considering Swiss residency. Calculator shows savings, 
                    follow-up mentions property requirements for B permits.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Wallet className="h-5 w-5" />
                    <h4 className="font-medium">Banking Comparison</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Attracts wealthy individuals exploring Swiss banking. Discussion naturally 
                    includes wealth preservation through real estate.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
