import { Header } from '@/components/sei/Header';
import { Footer } from '@/components/sei/Footer';

export const metadata = {
  title: 'Privacy Policy | SEI Saadiyat',
  description: 'Privacy Policy for SEI Saadiyat',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect information you provide directly to us, including name, email address, phone number, and other details when you register your interest or contact us.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the information we collect to respond to your inquiries, provide information about properties, and send marketing communications with your consent.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Information Sharing</h2>
            <p className="text-gray-600 mb-4">We do not sell or rent your personal information to third parties. We may share information with service providers who assist us in operating our website and conducting our business.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Security</h2>
            <p className="text-gray-600 mb-4">We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">If you have questions about this Privacy Policy, please contact us through our registration form.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
