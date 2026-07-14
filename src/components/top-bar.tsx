"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchDialog } from "./search-dialog"
import { Bell, LogOut, User } from "lucide-react"

export function TopBar() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", data.user.id)
          .single()
        setUser(profile || data.user)
      }
    }

    const fetchNotifications = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false)

      if (!error && count !== null) {
        setUnreadCount(count)
      }
    }

    fetchUser()
    fetchNotifications()

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => setUnreadCount((c) => c + 1)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 fixed top-0 left-0 lg:left-64 right-0 z-30">
      <SearchDialog />

      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-[#0A1628]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#D4AF37] text-[10px] font-bold text-[#0A1628] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8 bg-[#0A1628]">
                <AvatarFallback className="bg-[#0A1628] text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
