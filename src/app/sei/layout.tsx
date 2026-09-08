import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEI Saadiyat | Luxury Residences on Saadiyat Island",
  description: "778 luxury residences across 6 towers on Saadiyat Island, Abu Dhabi by Aldar Properties. Starting from AED 2.95M with 50/50 payment plan.",
  openGraph: {
    title: "SEI Saadiyat | Move Into Stillness",
    description: "Luxury residences on Saadiyat Island by Aldar Properties",
    url: "https://bydre.vercel.app/sei",
  },
};

export default function SEILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
