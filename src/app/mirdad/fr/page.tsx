import { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { MirdadHeader } from "../components/mirdad-header"
import { HeroSection } from "../components/hero-section"
import { UnitsSection } from "../components/units-section"
import { AmenitiesSection } from "../components/amenities-section"
import { LocationSection } from "../components/location-section"
import { DeveloperSection } from "../components/developer-section"
import { LeadForm } from "../components/lead-form"
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
    type: "website",
    images: ["/mirdad/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: dictFr.meta.title,
    description: dictFr.meta.description,
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

export default async function MirdadFrenchPage() {
  const { units, amenities, project } = await getData()

  // Map to French content where available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frenchUnits = units.map((unit: any) => ({
    ...unit,
    title: unit.title_fr || unit.title,
    description: unit.description_fr || unit.description,
    features: unit.features_fr || unit.features,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frenchAmenities = amenities.map((amenity: any) => ({
    ...amenity,
    name: amenity.name_fr || amenity.name,
  }))

  return (
    <>
      <link rel="alternate" hrefLang="en" href="/mirdad" />
      <link rel="alternate" hrefLang="fr" href="/mirdad/fr" />
      <link rel="alternate" hrefLang="x-default" href="/mirdad" />

      <JsonLd units={frenchUnits} project={project} locale="fr" />

      <main className="bg-[#0a0a0a]">
        <MirdadHeader locale="fr" dict={dictFr} project={project} />

        <article>
          <HeroSection dict={dictFr} project={project} />

          <UnitsSection units={frenchUnits} locale="fr" dict={dictFr} />

          <AmenitiesSection amenities={frenchAmenities} locale="fr" dict={dictFr} />

          <LocationSection dict={dictFr} />

          <DeveloperSection dict={dictFr} />

          <LeadForm locale="fr" dict={dictFr} units={frenchUnits} />
        </article>

        <MirdadFooter locale="fr" dict={dictFr} project={project} />
      </main>
    </>
  )
}
