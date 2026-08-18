import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DRE Homes | Dubai's Premier Real Estate Agency",
  description: "Find your dream property in Dubai. Buy, sell or rent with DRE Homes - trusted real estate experts with 10+ years of excellence. Off-plan and ready properties across Downtown, Palm Jumeirah, Dubai Hills, and more.",
  keywords: "Dubai real estate, property Dubai, buy property Dubai, rent Dubai, off-plan Dubai, Emaar, DAMAC, DRE Homes",
  openGraph: {
    title: "DRE Homes | Find Your DREam Home in Dubai",
    description: "We help you find a home directly with developers. Emaar, Nakheel, Danube, Meraas, Sobha, DAMAC - off-plan and ready projects.",
    type: "website",
  },
}

export default function DreNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  )
}
