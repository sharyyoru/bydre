import Script from "next/script"

type Model = {
  id: string
  slug: string
  title: string
  description: string
  price_aed: number
  piece_count: number
  complexity_level: string
  image_url: string
  stock_status: string
}

type FAQ = {
  question: string
  answer: string
}

interface JsonLdProps {
  models?: Model[]
  faqs?: FAQ[]
  locale?: string
}

export function JsonLd({ models = [], faqs = [], locale = "en" }: JsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://drehomes.com"
  const pageUrl = locale === "fr" ? `${baseUrl}/mirdad/fr` : `${baseUrl}/mirdad`

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mirdad",
    url: `${baseUrl}/mirdad`,
    logo: `${baseUrl}/mirdad/logo.png`,
    description:
      locale === "fr"
        ? "Modèles mécaniques kitbash premium avec instructions de montage numériques"
        : "Premium kitbash mechanical models with digital build instructions",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "French"],
    },
  }

  // Product schemas
  const productSchemas = models.map((model) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.title,
    description: model.description,
    image: model.image_url?.startsWith("http")
      ? model.image_url
      : `${baseUrl}${model.image_url}`,
    url: `${pageUrl}#${model.slug}`,
    brand: {
      "@type": "Brand",
      name: "Mirdad",
    },
    offers: {
      "@type": "Offer",
      price: model.price_aed,
      priceCurrency: "AED",
      availability:
        model.stock_status === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : model.stock_status === "preorder"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Mirdad",
      },
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Piece Count",
        value: model.piece_count,
      },
      {
        "@type": "PropertyValue",
        name: "Complexity",
        value: model.complexity_level,
      },
    ],
  }))

  // FAQ schema
  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null

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
        name: "Mirdad",
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
        ? "Mirdad | Modèles Mécaniques de Précision"
        : "Mirdad | Precision Mechanical Models",
    description:
      locale === "fr"
        ? "Modèles mécaniques kitbash premium avec instructions de montage numériques"
        : "Premium kitbash mechanical models with digital build instructions",
    url: pageUrl,
    inLanguage: locale === "fr" ? "fr-AE" : "en-AE",
    isPartOf: {
      "@type": "WebSite",
      name: "Mirdad",
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
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {productSchemas.map((schema, idx) => (
        <Script
          key={`product-${idx}`}
          id={`product-schema-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  )
}
