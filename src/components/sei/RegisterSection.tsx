'use client';

import Image from 'next/image';
import { RegistrationForm } from './RegistrationForm';
import { useSectionTracking } from '@/hooks/sei/useTracking';

export function RegisterSection() {
  const trackRef = useSectionTracking('register');

  return (
    <section id="register" ref={trackRef} className="py-24 lg:py-32 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#c9a962]/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-2 text-center lg:text-left">
              <Image
                src="/images/sei/sei_saadiyat_logo_light_en.webp"
                alt="SEI Saadiyat"
                width={160}
                height={60}
                className="h-12 w-auto mx-auto lg:mx-0 mb-6"
              />
              <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Register Your Interest</p>
              <h2 className="text-4xl md:text-5xl text-white font-light mb-6">
                Be Among <span className="font-semibold">The First</span>
              </h2>
              <p className="text-white/50 text-lg">
                Register today to receive exclusive pricing, floor plans, and priority access to unit selection.
              </p>
            </div>
            
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-2xl">
                <RegistrationForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
