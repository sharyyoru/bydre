import { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { MirdadHeader } from "./components/mirdad-header"
import { HeroSection } from "./components/hero-section"
import { FeaturedBuilds } from "./components/featured-builds"
import { FAQSection } from "./components/faq-section"
import { InquiryForm } from "./components/inquiry-form"
import { MirdadFooter } from "./components/mirdad-footer"
import { JsonLd } from "./components/json-ld"
import dictEn from "./dictionaries/en.json"

export const metadata: Metadata = {
  title: dictEn.meta.title,
  description: dictEn.meta.description,
  keywords: dictEn.meta.keywords,
  alternates: {
    canonical: "/mirdad",
    languages: {
      en: "/mirdad",
      fr: "/mirdad/fr",
    },
  },
  openGraph: {
    title: dictEn.meta.title,
    description: dictEn.meta.description,
    locale: "en_AE",
    alternateLocale: "fr_AE",
  },
}

async function getModels() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from("mirdad_models")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6)

    if (error) {
      console.error("Error fetching models:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Error in getModels:", err)
    return []
  }
}

export default async function MirdadPage() {
  const models = await getModels()

  return (
    <>
      {/* Hreflang tags for SEO */}
      <link rel="alternate" hrefLang="en" href="/mirdad" />
      <link rel="alternate" hrefLang="fr" href="/mirdad/fr" />
      <link rel="alternate" hrefLang="x-default" href="/mirdad" />

      {/* JSON-LD Structured Data */}
      <JsonLd
        models={models}
        faqs={dictEn.faq.questions}
        locale="en"
      />

      {/* Page Content */}
      <main>
        <MirdadHeader locale="en" dict={dictEn} />

        <article>
          <HeroSection dict={dictEn} />

          <FeaturedBuilds models={models} locale="en" dict={dictEn} />

          <FAQSection dict={dictEn} />

          <InquiryForm locale="en" dict={dictEn} />
        </article>

        <MirdadFooter locale="en" dict={dictEn} />
      </main>
    </>
  )
}
