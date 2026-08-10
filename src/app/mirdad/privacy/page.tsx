import { Metadata } from "next"
import enDict from "../dictionaries/en.json"
import { LegalPageLayout } from "../components/legal-page-layout"

export const metadata: Metadata = {
  title: "Privacy Policy | MIRDAD by Union Properties",
  description: "Learn how Union Properties collects, uses, and protects your personal information when you express interest in MIRDAD residences.",
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      locale="en"
      dict={enDict}
      title={enDict.privacy.title}
      subtitle={enDict.privacy.subtitle}
      lastUpdated={enDict.privacy.lastUpdated}
      backToHome={enDict.privacy.backToHome}
      sections={enDict.privacy.sections}
    />
  )
}
