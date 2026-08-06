"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Instagram, CheckCircle2, ArrowRight } from "lucide-react"

export default function CompliancePublicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-emerald-500" />
            <span className="text-xl font-bold text-white">DreHomes Compliance</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/compliance-public/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Log In
              </Button>
            </Link>
            <Link href="/compliance-public/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
            <Instagram className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">Instagram Integration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Real Estate Compliance Monitoring
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Monitor your Instagram content for RERA compliance. Connect your Instagram Business account to automatically scan posts for required disclosures.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/compliance-public/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/compliance-public/login">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Instagram className="h-10 w-10 text-pink-500 mb-2" />
              <CardTitle className="text-white">Instagram Connect</CardTitle>
              <CardDescription className="text-slate-400">
                Securely connect your Instagram Business account via Facebook Login
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Shield className="h-10 w-10 text-emerald-500 mb-2" />
              <CardTitle className="text-white">Compliance Scanning</CardTitle>
              <CardDescription className="text-slate-400">
                Automatically scan posts for RERA permit numbers and required disclosures
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CheckCircle2 className="h-10 w-10 text-blue-500 mb-2" />
              <CardTitle className="text-white">QR Code Tracking</CardTitle>
              <CardDescription className="text-slate-400">
                Generate and track QR codes for your marketing materials
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* For Reviewers */}
        <div className="max-w-2xl mx-auto mt-16">
          <Card className="bg-blue-900/30 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-blue-300">For Facebook App Reviewers</CardTitle>
              <CardDescription className="text-blue-200/70">
                Testing instructions for the Instagram Basic Display / Graph API integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click <strong>&quot;Create Free Account&quot;</strong> to register a test account</li>
                <li>After login, you&apos;ll be redirected to the Compliance Dashboard</li>
                <li>Click <strong>&quot;Connect Instagram&quot;</strong> to initiate OAuth flow</li>
                <li>Authorize the app with your Instagram Business account</li>
                <li>Your recent posts will be fetched and displayed</li>
                <li>The app scans posts for RERA compliance keywords</li>
              </ol>
              <div className="pt-4 border-t border-blue-500/20">
                <p className="text-xs text-blue-200/60">
                  <strong>Permissions requested:</strong> instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} DreHomes. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/data-deletion" className="hover:text-slate-300">Data Deletion</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
