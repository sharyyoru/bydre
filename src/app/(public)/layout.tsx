import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DreHomes | Luxury Real Estate Solutions",
  description: "Premium real estate services and property management solutions in the UAE. Register your interest today.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
