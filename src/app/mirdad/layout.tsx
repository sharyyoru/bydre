import type { Metadata } from "next"
import Script from "next/script"

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
      {/* Meta Pixel Code */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1436289015225741');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1436289015225741&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      {/* End Meta Pixel Code */}
      {children}
    </div>
  )
}
