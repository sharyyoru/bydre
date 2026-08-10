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
  currentLocale: "en" | "fr" | "ar"
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {

  const getLocalePath = (locale: "en" | "fr" | "ar") => {
    if (locale === "en") {
      return "/mirdad"
    }
    if (locale === "ar") {
      return "/mirdad/ar"
    }
    return "/mirdad/fr"
  }

  const getLocaleLabel = () => {
    if (currentLocale === "ar") return "AR"
    if (currentLocale === "fr") return "FR"
    return "EN"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="!bg-transparent !text-white/70 hover:text-[#C9A962] hover:bg-white/5 gap-2"
        >
          <Globe className="h-4 w-4" />
          <span>{getLocaleLabel()}</span>
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
        <DropdownMenuItem asChild>
          <Link
            href={getLocalePath("ar")}
            className={`flex items-center gap-2 cursor-pointer ${
              currentLocale === "ar" ? "text-amber-500" : "text-slate-300"
            }`}
          >
            <span className="text-lg">🇦🇪</span>
            العربية
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
