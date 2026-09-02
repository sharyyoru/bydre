"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Heart, User, Building2 } from "lucide-react"

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/drecrypto" },
  { icon: Search, label: "Search", href: "/drecrypto/buy" },
  { icon: Building2, label: "Off-Plan", href: "/drecrypto/offplan" },
  { icon: Heart, label: "Saved", href: "/drecrypto/saved" },
  { icon: User, label: "Menu", href: "/drecrypto/menu" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/drecrypto" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? "text-[#C9A962]" : "text-white/60"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
