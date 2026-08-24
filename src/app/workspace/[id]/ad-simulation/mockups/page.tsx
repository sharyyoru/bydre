"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Bitcoin,
  Building2,
  Wallet,
  Copy,
  Check,
  Instagram,
  Facebook,
  Globe
} from "lucide-react"

interface AdCreative {
  id: string
  theme: "crypto" | "tax" | "wealth"
  platform: "meta" | "google" | "instagram"
  headline: string
  description: string
  cta: string
  imagePrompt: string
  gradient: string
}

const AD_CREATIVES: AdCreative[] = [
  // Crypto Theme
  {
    id: "crypto-1",
    theme: "crypto",
    platform: "meta",
    headline: "Swiss Crypto Custody",
    description: "Secure your digital assets in the world's most trusted financial jurisdiction. Bank-grade security meets regulatory clarity.",
    cta: "Learn More",
    imagePrompt: "Swiss Alps with digital crypto elements, professional blue tones",
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    id: "crypto-2",
    theme: "crypto",
    platform: "instagram",
    headline: "Zug Crypto Valley",
    description: "Why 1000+ blockchain companies chose Switzerland 🇨🇭",
    cta: "Discover",
    imagePrompt: "Modern Zug skyline with blockchain network overlay",
    gradient: "from-purple-600 to-blue-600",
  },
  {
    id: "crypto-3",
    theme: "crypto",
    platform: "google",
    headline: "Protect Your 7-Figure Portfolio",
    description: "Swiss regulations • Institutional custody • Tax-optimized structures",
    cta: "Get Free Guide",
    imagePrompt: "Abstract secure vault with digital assets",
    gradient: "from-slate-700 to-slate-900",
  },
  // Tax Theme
  {
    id: "tax-1",
    theme: "tax",
    platform: "meta",
    headline: "Forfait Fiscal Explained",
    description: "How high-net-worth individuals pay fixed taxes in Switzerland. Lump-sum taxation for non-working residents.",
    cta: "Calculate Savings",
    imagePrompt: "Swiss chalet with financial charts overlay",
    gradient: "from-emerald-600 to-teal-800",
  },
  {
    id: "tax-2",
    theme: "tax",
    platform: "instagram",
    headline: "Swiss Tax Benefits",
    description: "No capital gains tax • Low income tax • Wealth preservation 💰",
    cta: "Learn How",
    imagePrompt: "Luxury Swiss lifestyle imagery",
    gradient: "from-green-500 to-emerald-700",
  },
  {
    id: "tax-3",
    theme: "tax",
    platform: "google",
    headline: "Relocate to Switzerland Tax-Free",
    description: "Forfait Fiscal • B Permit • Wealth Structuring | Free Consultation",
    cta: "Book Call",
    imagePrompt: "Geneva lake view with professional setting",
    gradient: "from-teal-600 to-cyan-800",
  },
  // Wealth Theme
  {
    id: "wealth-1",
    theme: "wealth",
    platform: "meta",
    headline: "Geneva Private Banking",
    description: "Join the world's elite in managing generational wealth. Minimum CHF 5M. Discretion guaranteed.",
    cta: "Request Introduction",
    imagePrompt: "Elegant Geneva banking district",
    gradient: "from-amber-600 to-orange-800",
  },
  {
    id: "wealth-2",
    theme: "wealth",
    platform: "instagram",
    headline: "Family Office Services",
    description: "When your portfolio needs dedicated management 🏦",
    cta: "Explore",
    imagePrompt: "Modern family office interior",
    gradient: "from-orange-500 to-red-600",
  },
  {
    id: "wealth-3",
    theme: "wealth",
    platform: "google",
    headline: "Diversify into Tangible Assets",
    description: "Art • Wine • Real Estate | Swiss Wealth Preservation Strategies",
    cta: "Download Guide",
    imagePrompt: "Luxury assets collection",
    gradient: "from-rose-600 to-pink-800",
  },
]

const THEME_ICONS = {
  crypto: Bitcoin,
  tax: Building2,
  wealth: Wallet,
}

const THEME_COLORS = {
  crypto: "bg-blue-100 text-blue-800",
  tax: "bg-green-100 text-green-800",
  wealth: "bg-orange-100 text-orange-800",
}

const PLATFORM_ICONS = {
  meta: Facebook,
  google: Globe,
  instagram: Instagram,
}

export default function AdMockupsPage() {
  const params = useParams()
  const workspaceId = params.id as string
  
  const [selectedTheme, setSelectedTheme] = useState<string>("all")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredAds = AD_CREATIVES.filter(ad => {
    const matchesTheme = selectedTheme === "all" || ad.theme === selectedTheme
    const matchesPlatform = selectedPlatform === "all" || ad.platform === selectedPlatform
    return matchesTheme && matchesPlatform
  })

  function copyAdCopy(ad: AdCreative) {
    const text = `${ad.headline}\n\n${ad.description}\n\nCTA: ${ad.cta}`
    navigator.clipboard.writeText(text)
    setCopiedId(ad.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/workspace/${workspaceId}/ad-simulation`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ad Mockups</h1>
            <p className="text-gray-600">
              Preview investment-themed ad creatives for Meta, Google & Instagram
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Theme</label>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedTheme === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedTheme("all")}
                  >
                    All
                  </Button>
                  <Button 
                    variant={selectedTheme === "crypto" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedTheme("crypto")}
                    className={selectedTheme === "crypto" ? "bg-blue-600" : ""}
                  >
                    <Bitcoin className="h-4 w-4 mr-1" /> Crypto
                  </Button>
                  <Button 
                    variant={selectedTheme === "tax" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedTheme("tax")}
                    className={selectedTheme === "tax" ? "bg-green-600" : ""}
                  >
                    <Building2 className="h-4 w-4 mr-1" /> Tax
                  </Button>
                  <Button 
                    variant={selectedTheme === "wealth" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedTheme("wealth")}
                    className={selectedTheme === "wealth" ? "bg-orange-600" : ""}
                  >
                    <Wallet className="h-4 w-4 mr-1" /> Wealth
                  </Button>
                </div>
              </div>
              
              <div className="border-l pl-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Platform</label>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedPlatform === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedPlatform("all")}
                  >
                    All
                  </Button>
                  <Button 
                    variant={selectedPlatform === "meta" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedPlatform("meta")}
                  >
                    <Facebook className="h-4 w-4 mr-1" /> Meta
                  </Button>
                  <Button 
                    variant={selectedPlatform === "google" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedPlatform("google")}
                  >
                    <Globe className="h-4 w-4 mr-1" /> Google
                  </Button>
                  <Button 
                    variant={selectedPlatform === "instagram" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedPlatform("instagram")}
                  >
                    <Instagram className="h-4 w-4 mr-1" /> Instagram
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ad Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => {
            const ThemeIcon = THEME_ICONS[ad.theme]
            const PlatformIcon = PLATFORM_ICONS[ad.platform]
            
            return (
              <Card key={ad.id} className="overflow-hidden">
                {/* Ad Preview */}
                <div className={`bg-gradient-to-br ${ad.gradient} p-6 text-white min-h-[200px] flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ThemeIcon className="h-5 w-5" />
                      <span className="text-sm opacity-80 uppercase tracking-wide">
                        {ad.theme}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{ad.headline}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {ad.description}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                      {ad.cta} →
                    </Button>
                  </div>
                </div>
                
                {/* Ad Info */}
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={THEME_COLORS[ad.theme]}>
                        {ad.theme}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <PlatformIcon className="h-3 w-3" />
                        {ad.platform}
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyAdCopy(ad)}
                    >
                      {copiedId === ad.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p className="font-medium mb-1">Image prompt:</p>
                    <p className="italic">{ad.imagePrompt}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Platform Specs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ad Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <Facebook className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Meta (Facebook/Instagram)</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Feed: 1080 x 1080px (1:1)</li>
                    <li>• Stories: 1080 x 1920px (9:16)</li>
                    <li>• Carousel: 1080 x 1080px each</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded">
                  <Globe className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium">Google Display</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Leaderboard: 728 x 90px</li>
                    <li>• Rectangle: 300 x 250px</li>
                    <li>• Skyscraper: 160 x 600px</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 rounded">
                  <Instagram className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-medium">Instagram Stories</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Size: 1080 x 1920px</li>
                    <li>• Max 15 sec video</li>
                    <li>• Swipe-up CTA</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
