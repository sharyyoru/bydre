import { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { MirdadHeader } from "./components/mirdad-header"
import { HeroSection } from "./components/hero-section"
import { UnitsSection } from "./components/units-section"
import { AmenitiesSection } from "./components/amenities-section"
import { LocationSection } from "./components/location-section"
import { DeveloperSection } from "./components/developer-section"
import { LeadForm } from "./components/lead-form"
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
    type: "website",
    images: ["/mirdad/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: dictEn.meta.title,
    description: dictEn.meta.description,
  },
}

async function getData() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [unitsRes, amenitiesRes, projectRes] = await Promise.all([
      supabase.from("mirdad_units").select("*").eq("is_available", true).order("display_order"),
      supabase.from("mirdad_amenities").select("*").order("display_order"),
      supabase.from("mirdad_project").select("*").limit(1).single(),
    ])

    return {
      units: unitsRes.data || [],
      amenities: amenitiesRes.data || [],
      project: projectRes.data || null,
    }
  } catch (err) {
    console.error("Error fetching data:", err)
    return { units: [], amenities: [], project: null }
  }
}

export default async function MirdadPage() {
  const { units, amenities, project } = await getData()

  return (
    <>
      <link rel="alternate" hrefLang="en" href="/mirdad" />
      <link rel="alternate" hrefLang="fr" href="/mirdad/fr" />
      <link rel="alternate" hrefLang="x-default" href="/mirdad" />

      <JsonLd units={units} project={project} locale="en" />

      <main className="bg-[#0a0a0a]">
        <MirdadHeader locale="en" dict={dictEn} project={project} />

        <article>
          <HeroSection dict={dictEn} project={project} />

          <UnitsSection units={units} locale="en" dict={dictEn} />

          <AmenitiesSection amenities={amenities} locale="en" dict={dictEn} />

          <LocationSection dict={dictEn} />

          <DeveloperSection dict={dictEn} />

          <LeadForm locale="en" dict={dictEn} units={units} />
        </article>

        <MirdadFooter locale="en" dict={dictEn} project={project} />
      </main>
    </>
  )
}
