import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MirdadHeader } from "./mirdad-header"
import { MirdadFooter } from "./mirdad-footer"

interface Section {
  title: string
  content: string
  items?: string[]
  dataTypes?: string
  noSale?: string
  binding?: string
}

interface LegalPageLayoutProps {
  locale: "en" | "fr"
  dict: {
    nav: {
      residences: string
      amenities: string
      location: string
      developer: string
      contact: string
      registerInterest: string
    }
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
  title: string
  subtitle: string
  lastUpdated: string
  backToHome: string
  sections: Record<string, Section>
}

export function LegalPageLayout({
  locale,
  dict,
  title,
  subtitle,
  lastUpdated,
  backToHome,
  sections,
}: LegalPageLayoutProps) {
  const basePath = locale === "fr" ? "/mirdad/fr" : "/mirdad"

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MirdadHeader locale={locale} dict={dict} />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Link */}
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 text-[#C9A962] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {backToHome}
          </Link>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-light text-white mb-4">
              {title}
            </h1>
            <p className="text-white/60 text-lg mb-2">{subtitle}</p>
            <p className="text-white/40 text-sm">{lastUpdated}</p>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {Object.entries(sections).map(([key, section]) => (
              <section key={key} className="border-l-2 border-[#C9A962]/30 pl-6">
                <h2 className="text-2xl font-medium text-white mb-4">
                  {section.title}
                </h2>
                <p className="text-white/70 leading-relaxed mb-4">
                  {section.content}
                </p>

                {section.items && (
                  <ul className="space-y-2 mb-4">
                    {section.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-white/70"
                      >
                        <span className="text-[#C9A962] mt-1.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.dataTypes && (
                  <p className="text-white/70 leading-relaxed mb-4">
                    {section.dataTypes}
                  </p>
                )}

                {section.noSale && (
                  <p className="text-white/70 leading-relaxed font-medium">
                    {section.noSale}
                  </p>
                )}

                {section.binding && (
                  <p className="text-white/70 leading-relaxed font-medium mt-4">
                    {section.binding}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>

      <MirdadFooter locale={locale} dict={dict} />
    </div>
  )
}
