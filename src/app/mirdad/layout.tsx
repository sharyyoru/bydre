import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Mirdad | Precision Mechanical Models",
    template: "%s | Mirdad",
  },
  description:
    "Premium kitbash mechanical models with digital build instructions. Custom mechs, vehicles, and architecture from premium brick sets.",
  keywords: [
    "mechanical models",
    "kitbash",
    "3D instructions",
    "brick building",
    "custom mechs",
    "MOC",
    "digital instructions",
    "premium builds",
  ],
  authors: [{ name: "Mirdad" }],
  creator: "Mirdad",
  publisher: "Mirdad",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://drehomes.com"),
  alternates: {
    canonical: "/mirdad",
    languages: {
      en: "/mirdad",
      fr: "/mirdad/fr",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    alternateLocale: "fr_AE",
    url: "/mirdad",
    siteName: "Mirdad",
    title: "Mirdad | Precision Mechanical Models",
    description:
      "Premium kitbash mechanical models with digital build instructions. Custom mechs, vehicles, and architecture from premium brick sets.",
    images: [
      {
        url: "/mirdad/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mirdad Precision Mechanical Models",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirdad | Precision Mechanical Models",
    description:
      "Premium kitbash mechanical models with digital build instructions.",
    images: ["/mirdad/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function MirdadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {children}
    </div>
  )
}
