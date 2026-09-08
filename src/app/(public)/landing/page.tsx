import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ValueBar } from "@/components/landing/ValueBar";
import { Services } from "@/components/landing/Services";
import { Properties } from "@/components/landing/Properties";
import { About } from "@/components/landing/About";
import { Testimonials } from "@/components/landing/Testimonials";
import { RegisterSection } from "@/components/landing/RegisterSection";
import { Footer } from "@/components/landing/Footer";
import { MobileCTA } from "@/components/landing/MobileCTA";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ValueBar />
        <Services />
        <Properties />
        <About />
        <Testimonials />
        <RegisterSection />
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
