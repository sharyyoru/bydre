import { Header } from '@/components/sei/Header';
import { Footer } from '@/components/sei/Footer';

export const metadata = {
  title: 'Terms of Use | SEI Saadiyat',
  description: 'Terms of Use for SEI Saadiyat',
};

export default function TermsOfUsePage() {
  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Use</h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">By accessing and using this website, you accept and agree to be bound by these Terms of Use.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Use of Website</h2>
            <p className="text-gray-600 mb-4">This website is for informational purposes only. All images, plans, and specifications are for illustration purposes and are subject to change without notice.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Intellectual Property</h2>
            <p className="text-gray-600 mb-4">All content on this website, including text, images, logos, and designs, is the property of the respective owners and is protected by intellectual property laws.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Disclaimer</h2>
            <p className="text-gray-600 mb-4">The information provided on this website is subject to change without notice. The developer reserves the right to make revisions to any information contained herein.</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">We shall not be liable for any damages arising from the use of this website or reliance on the information provided.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
