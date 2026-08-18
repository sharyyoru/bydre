import Link from "next/link"
import { Mail, MapPin } from "lucide-react"

interface Project {
  contact_phone?: string
  contact_whatsapp?: string
  contact_email?: string
}

interface MirdadFooterProps {
  locale: "en" | "fr" | "ar"
  dict: {
    footer: {
      developer: string
      tagline: string
      copyright: string
      disclaimer: string
      links: {
        privacy: string
        terms: string
        disclaimer: string
      }
    }
  }
  project?: Project | null
}

export function MirdadFooter({ locale, dict }: MirdadFooterProps) {
  const currentYear = new Date().getFullYear()
  const basePath = locale === "fr" ? "/mirdad/fr" : locale === "ar" ? "/mirdad/ar" : "/mirdad"

  const getLocalizedText = (en: string, fr: string, ar: string) => {
    if (locale === "ar") return ar
    if (locale === "fr") return fr
    return en
  }

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={basePath} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border border-[#C9A962] flex items-center justify-center">
                <span className="text-lg font-bold text-[#C9A962]">M</span>
              </div>
              <div>
                <span className="text-xl font-light text-white tracking-wider">MIRDAD</span>
              </div>
            </Link>
            <p className="text-white/50 text-sm mb-4">{dict.footer.developer}</p>
            <p className="text-[#C9A962] text-lg font-light italic">&quot;{dict.footer.tagline}&quot;</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium mb-6 tracking-wider text-sm uppercase">
              {getLocalizedText("Quick Links", "Liens Rapides", "روابط سريعة")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#residences" className="text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  {getLocalizedText("Residences", "Résidences", "الوحدات السكنية")}
                </a>
              </li>
              <li>
                <a href="#amenities" className="text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  {getLocalizedText("Amenities", "Équipements", "المرافق")}
                </a>
              </li>
              <li>
                <a href="#location" className="text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  {getLocalizedText("Location", "Emplacement", "الموقع")}
                </a>
              </li>
              <li>
                <a href="#developer" className="text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  {getLocalizedText("Developer", "Promoteur", "المطور")}
                </a>
              </li>
              <li>
                <a href="#register" className="text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  {getLocalizedText("Register Interest", "S'inscrire", "سجل اهتمامك")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-medium mb-6 tracking-wider text-sm uppercase">
              {getLocalizedText("Contact", "Contact", "تواصل معنا")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a href="#register" className="flex items-center gap-3 text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  <Mail className="h-4 w-4 text-[#C9A962]" />
                  {getLocalizedText("Register Your Interest", "Inscrivez-vous", "سجل اهتمامك")}
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-white/60 text-sm">
                  <MapPin className="h-4 w-4 text-[#C9A962] flex-shrink-0 mt-0.5" />
                  Motor City, Dubai, UAE
                </div>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-medium mb-6 tracking-wider text-sm uppercase">
              {getLocalizedText("Legal", "Légal", "قانوني")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href={`${basePath}/privacy`} className="text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  {dict.footer.links.privacy}
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/terms`} className="text-white/60 hover:text-[#C9A962] transition-colors text-sm">
                  {dict.footer.links.terms}
                </Link>
              </li>
            </ul>

            {/* Language Switcher */}
            <div className="mt-8">
              <h5 className="text-white/40 text-xs uppercase tracking-wider mb-3">
                {getLocalizedText("Language", "Langue", "اللغة")}
              </h5>
              <div className="flex gap-2">
                <Link
                  href="/mirdad"
                  className={`px-3 py-1 text-xs border ${
                    locale === "en"
                      ? "border-[#C9A962] text-[#C9A962]"
                      : "border-white/20 text-white/60 hover:border-[#C9A962]"
                  }`}
                >
                  EN
                </Link>
                <Link
                  href="/mirdad/fr"
                  className={`px-3 py-1 text-xs border ${
                    locale === "fr"
                      ? "border-[#C9A962] text-[#C9A962]"
                      : "border-white/20 text-white/60 hover:border-[#C9A962]"
                  }`}
                >
                  FR
                </Link>
                <Link
                  href="/mirdad/ar"
                  className={`px-3 py-1 text-xs border ${
                    locale === "ar"
                      ? "border-[#C9A962] text-[#C9A962]"
                      : "border-white/20 text-white/60 hover:border-[#C9A962]"
                  }`}
                >
                  AR
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40">
              {dict.footer.copyright.replace("{year}", currentYear.toString())}
            </p>
            <p className="text-xs text-white/30 text-center md:text-right max-w-xl">
              {dict.footer.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
