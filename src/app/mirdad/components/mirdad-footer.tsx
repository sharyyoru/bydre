import Link from "next/link"
import { Wrench } from "lucide-react"

interface MirdadFooterProps {
  locale: "en" | "fr"
  dict: {
    footer: {
      tagline: string
      copyright: string
      links: {
        privacy: string
        terms: string
        contact: string
      }
    }
  }
}

export function MirdadFooter({ locale, dict }: MirdadFooterProps) {
  const currentYear = new Date().getFullYear()
  const basePath = locale === "fr" ? "/mirdad/fr" : "/mirdad"

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={basePath} className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Wrench className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-lg font-bold text-white">Mirdad</span>
            </Link>
            <p className="text-sm text-slate-400">{dict.footer.tagline}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">
              {locale === "fr" ? "Liens Rapides" : "Quick Links"}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#collection"
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {locale === "fr" ? "Collection" : "Collection"}
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {dict.footer.links.contact}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">
              {locale === "fr" ? "Légal" : "Legal"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {dict.footer.links.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {dict.footer.links.terms}
                </Link>
              </li>
            </ul>
          </div>

          {/* Language */}
          <div>
            <h4 className="font-semibold text-white mb-4">
              {locale === "fr" ? "Langue" : "Language"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/mirdad"
                  className={`text-sm transition-colors ${
                    locale === "en"
                      ? "text-amber-400"
                      : "text-slate-400 hover:text-amber-400"
                  }`}
                >
                  🇬🇧 English
                </Link>
              </li>
              <li>
                <Link
                  href="/mirdad/fr"
                  className={`text-sm transition-colors ${
                    locale === "fr"
                      ? "text-amber-400"
                      : "text-slate-400 hover:text-amber-400"
                  }`}
                >
                  🇫🇷 Français
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500">
            {dict.footer.copyright.replace("{year}", currentYear.toString())}
          </p>
        </div>
      </div>
    </footer>
  )
}
