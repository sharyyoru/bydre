import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import UaeNationalBuilder from "./UaeNationalBuilder";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ibm-arabic",
});

export const metadata: Metadata = {
  title: "DRE Open House – Agent RSVP Email Builder",
  robots: { index: false, follow: false },
};

export default function UaeNationalPage() {
  return (
    <div className={ibmPlexArabic.variable}>
      <UaeNationalBuilder />
    </div>
  );
}
