import { Metadata } from "next"
import frDict from "../../dictionaries/fr.json"
import { LegalPageLayout } from "../../components/legal-page-layout"

export const metadata: Metadata = {
  title: "Conditions Générales | MIRDAD par Union Properties",
  description: "Lisez les conditions générales d'utilisation du site web MIRDAD par Union Properties, y compris les avertissements immobiliers et la loi applicable.",
}

export default function TermsPageFr() {
  return (
    <LegalPageLayout
      locale="fr"
      dict={frDict}
      title={frDict.terms.title}
      subtitle={frDict.terms.subtitle}
      lastUpdated={frDict.terms.lastUpdated}
      backToHome={frDict.terms.backToHome}
      sections={frDict.terms.sections}
    />
  )
}
