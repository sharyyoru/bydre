import { Metadata } from "next"
import arDict from "../../dictionaries/ar.json"
import { LegalPageLayout } from "../../components/legal-page-layout"

export const metadata: Metadata = {
  title: "الشروط والأحكام | ميرداد من يونيون بروبرتيز",
  description: "اقرأ الشروط والأحكام لاستخدام موقع ميرداد من يونيون بروبرتيز، بما في ذلك إخلاء المسؤولية العقارية والقانون الحاكم.",
}

export default function TermsPageAr() {
  return (
    <LegalPageLayout
      locale="ar"
      dict={arDict}
      title={arDict.terms.title}
      subtitle={arDict.terms.subtitle}
      lastUpdated={arDict.terms.lastUpdated}
      backToHome={arDict.terms.backToHome}
      sections={arDict.terms.sections}
    />
  )
}
