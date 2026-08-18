import {
  Header,
  HeroSection,
  HotProperties,
  PropertyCategories,
  SignatureNeighborhoods,
  FeaturedProperties,
  FoundersSection,
  TopAgents,
  AboutSection,
  GoldenVisa,
  Testimonials,
  ContactSection,
  Footer,
  WhatsAppButton,
} from "@/components/drenew"

export default function DreNewPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <HotProperties />
        <PropertyCategories />
        <SignatureNeighborhoods />
        <FeaturedProperties />
        <FoundersSection />
        <TopAgents />
        <AboutSection />
        <GoldenVisa />
        <Testimonials />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
