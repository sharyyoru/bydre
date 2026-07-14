"use client"

import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dre-surface">
      <Sidebar />
      <TopBar />
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
