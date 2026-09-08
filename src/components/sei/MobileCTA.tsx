'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Gift, Clock, Phone } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { RegistrationForm } from './RegistrationForm';

export function MobileCTA() {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const popupShown = sessionStorage.getItem('sei_popup_shown');
    if (popupShown) setPopupDismissed(true);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((scrollTop / docHeight) * 100);
      setShowStickyBar(scrollTop > 100);
    };

    const popupTimer = setTimeout(() => {
      if (!sessionStorage.getItem('sei_popup_shown') && !popupDismissed && scrollProgress > 15) {
        setShowPopup(true);
        sessionStorage.setItem('sei_popup_shown', 'true');
      }
    }, 10000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(popupTimer);
    };
  }, [popupDismissed, scrollProgress]);

  const handleRegisterClick = () => {
    setIsModalOpen(true);
    setShowPopup(false);
  };

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="h-1 bg-white/10"><div className="h-full bg-[#c9a962] transition-all duration-150" style={{ width: `${scrollProgress}%` }} /></div>
        <div className="bg-[#0a0a0a]/98 backdrop-blur-lg border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">SEI Saadiyat</p>
              <p className="text-[#c9a962] text-xs">From AED 2.95M • 50/50 Plan</p>
            </div>
            <Button onClick={handleRegisterClick} size="sm" className="bg-[#c9a962] hover:bg-[#b8984f] text-black font-semibold whitespace-nowrap">Register Now</Button>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowPopup(false); setPopupDismissed(true); }} />
          <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-t-3xl p-6 pb-8">
            <button onClick={() => { setShowPopup(false); setPopupDismissed(true); }} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 bg-[#c9a962]/20 text-[#c9a962] px-3 py-1.5 rounded-full text-sm font-medium mb-4"><Gift className="w-4 h-4" />Exclusive Offer</div>
              <h3 className="text-2xl font-semibold text-white mb-2">Get Priority Access</h3>
              <p className="text-white/60 mb-6">Register now for exclusive pricing and priority unit selection at SEI Saadiyat.</p>
              <Button onClick={handleRegisterClick} size="lg" className="w-full bg-[#c9a962] hover:bg-[#b8984f] text-black font-semibold">
                Register Your Interest <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-center text-white/40 text-xs mt-4 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />Limited units available</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleRegisterClick} className={`fixed right-4 z-40 lg:hidden w-14 h-14 rounded-full bg-[#c9a962] shadow-lg flex items-center justify-center transition-all duration-300 ${showStickyBar ? 'bottom-20 scale-100 opacity-100' : 'bottom-6 scale-0 opacity-0'}`}>
        <Phone className="w-6 h-6 text-black" />
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Your Interest">
        <p className="text-gray-600 mb-6">Be among the first to access exclusive pricing at SEI Saadiyat.</p>
        <RegistrationForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
