'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageCircle, X } from 'lucide-react';

export function MobileCTA() {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 300);
    };

    // Show popup after 15 seconds
    const popupTimer = setTimeout(() => {
      const popupShown = sessionStorage.getItem('drehomes_popup_shown');
      if (!popupShown && window.scrollY > 200) {
        setShowPopup(true);
        sessionStorage.setItem('drehomes_popup_shown', 'true');
      }
    }, 15000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(popupTimer);
    };
  }, []);

  const handleRegisterClick = () => {
    setShowPopup(false);
    const form = document.getElementById('register');
    form?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Sticky Bottom Bar - Mobile Only */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-slate-900/98 backdrop-blur-lg border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">DreHomes</p>
              <p className="text-amber-500 text-xs">Free Property Consultation</p>
            </div>
            <a
              href="tel:+971501234567"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Call</span>
            </a>
            <button
              onClick={handleRegisterClick}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2.5 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Inquire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exit Intent Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Get Expert Advice
              </h3>
              <p className="text-white/60 mb-6">
                Speak with our property experts and get personalized recommendations.
              </p>
              <button
                onClick={handleRegisterClick}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-4 rounded-lg transition-colors mb-3"
              >
                Register Your Interest
              </button>
              <a
                href="tel:+971501234567"
                className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-lg transition-colors"
              >
                Call Us Now
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
