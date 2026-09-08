import { Header } from "@/components/sei/Header";
import { Hero } from "@/components/sei/Hero";
import { ValueBar } from "@/components/sei/ValueBar";
import { AboutSection } from "@/components/sei/AboutSection";
import { UnitTypes } from "@/components/sei/UnitTypes";
import { Gallery } from "@/components/sei/Gallery";
import { Location } from "@/components/sei/Location";
import { Developer } from "@/components/sei/Developer";
import { FAQ } from "@/components/sei/FAQ";
import { FeaturedArticles } from "@/components/sei/FeaturedArticles";
import { RegisterSection } from "@/components/sei/RegisterSection";
import { Footer } from "@/components/sei/Footer";
import { TrackingProvider } from "@/components/sei/TrackingProvider";
import { MobileCTA } from "@/components/sei/MobileCTA";

export default function SEIPage() {
  return (
    <TrackingProvider>
      <Header />
      <main>
        <Hero />
        <ValueBar />
        <AboutSection />
        <UnitTypes />
        <Gallery />
        <Location />
        <Developer />
        <FAQ />
        <FeaturedArticles />
        <RegisterSection />
      </main>
      <Footer />
      <MobileCTA />
    </TrackingProvider>
  );
}
