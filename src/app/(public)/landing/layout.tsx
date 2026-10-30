import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Palm Springs, Jebel Ali | Discover with DRE",
  description:
    "Explore Palm Springs by Nakheel in Jebel Ali with DRE. Discover the anticipated 3–5 bedroom residences, proposed payment plan and latest launch information.",
  openGraph: {
    title: "Palm Springs, Jebel Ali | Discover with DRE",
    description:
      "A new chapter by Nakheel. Explore the anticipated Palm Springs collection with your DRE property advisor.",
    url: "https://bydre.vercel.app/landing",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
