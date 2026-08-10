"use client"

import Link from "next/link"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LanguageSwitcherProps {
  currentLocale: "en" | "fr"
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {

  const getLocalePath = (locale: "en" | "fr") => {
    if (locale === "en") {
      return "/mirdad"
    }
    return "/mirdad/fr"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLocale === "en" ? "EN" : "FR"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-slate-900 border-slate-700"
      >
        <DropdownMenuItem asChild>
          <Link
            href={getLocalePath("en")}
            className={`flex items-center gap-2 cursor-pointer ${
              currentLocale === "en" ? "text-amber-500" : "text-slate-300"
            }`}
          >
            <span className="text-lg">🇬🇧</span>
            English
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={getLocalePath("fr")}
            className={`flex items-center gap-2 cursor-pointer ${
              currentLocale === "fr" ? "text-amber-500" : "text-slate-300"
            }`}
          >
            <span className="text-lg">🇫🇷</span>
            Français
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
