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
import dictAr from "../dictionaries/ar.json"

export const metadata: Metadata = {
  title: dictAr.meta.title,
  description: dictAr.meta.description,
  keywords: dictAr.meta.keywords,
  alternates: {
    canonical: "/mirdad/ar",
    languages: {
      en: "/mirdad",
      fr: "/mirdad/fr",
      ar: "/mirdad/ar",
    },
  },
  openGraph: {
    title: dictAr.meta.title,
    description: dictAr.meta.description,
    locale: "ar_AE",
    alternateLocale: ["en_AE", "fr_AE"],
    type: "website",
    images: ["/mirdad/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: dictAr.meta.title,
    description: dictAr.meta.description,
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

export default async function MirdadArabicPage() {
  const { units, amenities, project } = await getData()

  // Map to Arabic content where available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arabicUnits = units.map((unit: any) => ({
    ...unit,
    title: unit.title_ar || unit.title,
    description: unit.description_ar || unit.description,
    features: unit.features_ar || unit.features,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arabicAmenities = amenities.map((amenity: any) => ({
    ...amenity,
    name: amenity.name_ar || amenity.name,
  }))

  return (
    <>
      <link rel="alternate" hrefLang="en" href="/mirdad" />
      <link rel="alternate" hrefLang="fr" href="/mirdad/fr" />
      <link rel="alternate" hrefLang="ar" href="/mirdad/ar" />
      <link rel="alternate" hrefLang="x-default" href="/mirdad" />

      <JsonLd units={arabicUnits} project={project} locale="ar" />

      <main className="bg-[#0a0a0a]" dir="rtl">
        <MirdadHeader locale="ar" dict={dictAr} project={project} />

        <article>
          <HeroSection dict={dictAr} project={project} />

          <UnitsSection units={arabicUnits} locale="ar" dict={dictAr} />

          <AmenitiesSection amenities={arabicAmenities} locale="ar" dict={dictAr} />

          <LocationSection dict={dictAr} />

          <DeveloperSection dict={dictAr} />

          <LeadForm locale="ar" dict={dictAr} units={arabicUnits} />
        </article>

        <MirdadFooter locale="ar" dict={dictAr} project={project} />
      </main>
    </>
  )
}
