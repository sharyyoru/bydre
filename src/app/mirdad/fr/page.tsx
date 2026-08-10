import { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { MirdadHeader } from "../components/mirdad-header"
import { HeroSection } from "../components/hero-section"
import { FeaturedBuilds } from "../components/featured-builds"
import { FAQSection } from "../components/faq-section"
import { InquiryForm } from "../components/inquiry-form"
import { MirdadFooter } from "../components/mirdad-footer"
import { JsonLd } from "../components/json-ld"
import dictFr from "../dictionaries/fr.json"

export const metadata: Metadata = {
  title: dictFr.meta.title,
  description: dictFr.meta.description,
  keywords: dictFr.meta.keywords,
  alternates: {
    canonical: "/mirdad/fr",
    languages: {
      en: "/mirdad",
      fr: "/mirdad/fr",
    },
  },
  openGraph: {
    title: dictFr.meta.title,
    description: dictFr.meta.description,
    locale: "fr_AE",
    alternateLocale: "en_AE",
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

export default async function MirdadFrenchPage() {
  const models = await getModels()

  // Map model fields to French where available
  const frenchModels = models.map((model) => ({
    ...model,
    title: model.title_fr || model.title,
    short_description: model.short_description_fr || model.short_description,
    category: model.category_fr || model.category,
  })) as typeof models

  return (
    <>
      {/* Hreflang tags for SEO */}
      <link rel="alternate" hrefLang="en" href="/mirdad" />
      <link rel="alternate" hrefLang="fr" href="/mirdad/fr" />
      <link rel="alternate" hrefLang="x-default" href="/mirdad" />

      {/* JSON-LD Structured Data */}
      <JsonLd
        models={frenchModels}
        faqs={dictFr.faq.questions}
        locale="fr"
      />

      {/* Page Content */}
      <main>
        <MirdadHeader locale="fr" dict={dictFr} />

        <article>
          <HeroSection dict={dictFr} />

          <FeaturedBuilds models={frenchModels} locale="fr" dict={dictFr} />

          <FAQSection dict={dictFr} />

          <InquiryForm locale="fr" dict={dictFr} />
        </article>

        <MirdadFooter locale="fr" dict={dictFr} />
      </main>
    </>
  )
}
