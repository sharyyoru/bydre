import { Metadata } from "next"
import enDict from "../dictionaries/en.json"
import { LegalPageLayout } from "../components/legal-page-layout"

export const metadata: Metadata = {
  title: "Terms & Conditions | MIRDAD by Union Properties",
  description: "Read the terms and conditions for using the MIRDAD website by Union Properties, including property disclaimers and governing law.",
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      locale="en"
      dict={enDict}
      title={enDict.terms.title}
      subtitle={enDict.terms.subtitle}
      lastUpdated={enDict.terms.lastUpdated}
      backToHome={enDict.terms.backToHome}
      sections={enDict.terms.sections}
    />
  )
}
