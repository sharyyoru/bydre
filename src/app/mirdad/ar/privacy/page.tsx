import { Metadata } from "next"
import arDict from "../../dictionaries/ar.json"
import { LegalPageLayout } from "../../components/legal-page-layout"

export const metadata: Metadata = {
  title: "سياسة الخصوصية | ميرداد من يونيون بروبرتيز",
  description: "تعرف على كيفية جمع واستخدام وحماية يونيون بروبرتيز لمعلوماتك الشخصية عند إبداء اهتمامك بمساكن ميرداد.",
}

export default function PrivacyPageAr() {
  return (
    <LegalPageLayout
      locale="ar"
      dict={arDict}
      title={arDict.privacy.title}
      subtitle={arDict.privacy.subtitle}
      lastUpdated={arDict.privacy.lastUpdated}
      backToHome={arDict.privacy.backToHome}
      sections={arDict.privacy.sections}
    />
  )
}
