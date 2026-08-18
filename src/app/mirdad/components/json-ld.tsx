import Script from "next/script"

type Unit = {
  id: string
  unit_type: string
  title: string
  description?: string
  starting_price_aed: number
  size_sqft_min: number
  bedrooms: number
}

type Project = {
  name?: string
  tagline?: string
  developer?: string
  location?: string
  starting_price_aed?: number
  contact_phone?: string
  contact_email?: string
}

interface JsonLdProps {
  units?: Unit[]
  project?: Project | null
  locale?: string
}

export function JsonLd({ units = [], project, locale = "en" }: JsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://drehomes.com"
  const pageUrl = locale === "fr" ? `${baseUrl}/mirdad/fr` : `${baseUrl}/mirdad`

  // Real Estate Development Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Union Properties",
    url: "https://up.ae",
    logo: `${baseUrl}/mirdad/logo.png`,
    description: "Union Properties PJSC - Dubai's leading real estate developer since 1987",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "UAE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      url: `${baseUrl}/mirdad#register`,
      contactType: "sales",
      availableLanguage: ["English", "French", "Arabic"],
    },
  }

  // Real Estate Project schema
  const realEstateSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project?.name || "MIRDAD",
    description:
      locale === "fr"
        ? "MIRDAD par Union Properties - Résidences de luxe à Motor City, Dubai"
        : "MIRDAD by Union Properties - Luxury residences in Motor City, Dubai",
    url: pageUrl,
    image: `${baseUrl}/mirdad/og-image.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Motor City",
      addressLocality: "Dubai",
      addressCountry: "UAE",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: project?.starting_price_aed || 999000,
      priceCurrency: "AED",
      offerCount: units.length,
    },
  }

  // Apartment/Unit schemas
  const unitSchemas = units.map((unit) => ({
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: unit.title,
    description: unit.description,
    numberOfRooms: unit.bedrooms + 1,
    numberOfBedrooms: unit.bedrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: unit.size_sqft_min,
      unitCode: "FTK",
    },
    offers: {
      "@type": "Offer",
      price: unit.starting_price_aed,
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
    },
  }))

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "MIRDAD",
        item: pageUrl,
      },
    ],
  }

  // WebPage schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name:
      locale === "fr"
        ? "MIRDAD par Union Properties | Résidences de Luxe à Motor City, Dubai"
        : "MIRDAD by Union Properties | Luxury Residences in Motor City, Dubai",
    description:
      locale === "fr"
        ? "Découvrez MIRDAD, une nouvelle ère de vie raffinée et durable à Motor City, Dubai."
        : "Discover MIRDAD, a new era of refined, sustainable living in Motor City, Dubai.",
    url: pageUrl,
    inLanguage: locale === "fr" ? "fr-AE" : "en-AE",
    isPartOf: {
      "@type": "WebSite",
      name: "MIRDAD",
      url: `${baseUrl}/mirdad`,
    },
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="realestate-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateSchema) }}
      />
      <Script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {unitSchemas.map((schema, idx) => (
        <Script
          key={`unit-${idx}`}
          id={`unit-schema-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
