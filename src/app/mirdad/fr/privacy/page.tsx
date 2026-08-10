import { Metadata } from "next"
import frDict from "../../dictionaries/fr.json"
import { LegalPageLayout } from "../../components/legal-page-layout"

export const metadata: Metadata = {
  title: "Politique de Confidentialité | MIRDAD par Union Properties",
  description: "Découvrez comment Union Properties collecte, utilise et protège vos informations personnelles lorsque vous exprimez votre intérêt pour les résidences MIRDAD.",
}

export default function PrivacyPageFr() {
  return (
    <LegalPageLayout
      locale="fr"
      dict={frDict}
      title={frDict.privacy.title}
      subtitle={frDict.privacy.subtitle}
      lastUpdated={frDict.privacy.lastUpdated}
      backToHome={frDict.privacy.backToHome}
      sections={frDict.privacy.sections}
    />
  )
}
