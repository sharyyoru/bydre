"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dre-surface">
      <Sidebar />
      <TopBar />
      <div className="lg:hidden fixed top-0 left-0 z-40 h-16 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#0A1628]">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[#0A1628] border-r-0">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>
      </div>
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
