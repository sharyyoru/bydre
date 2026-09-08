import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DreHomes | Premium Real Estate Services in UAE",
  description: "Discover exceptional properties and investment opportunities with DreHomes. From off-plan developments to ready homes, we deliver excellence in UAE real estate.",
  openGraph: {
    title: "DreHomes | Premium Real Estate Services",
    description: "Your trusted partner for luxury real estate in the UAE.",
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
