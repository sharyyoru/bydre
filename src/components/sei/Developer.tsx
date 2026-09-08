'use client';

import Image from 'next/image';
import { Building2, Home, Award, Leaf } from 'lucide-react';
import { useSectionTracking } from '@/hooks/sei/useTracking';

const achievements = [
  { icon: Building2, value: '85+', label: 'Projects Delivered' },
  { icon: Home, value: '100K+', label: 'Residents Housed' },
  { icon: Award, value: '#1', label: 'Abu Dhabi Developer' },
  { icon: Leaf, value: 'Pearl 3', label: 'Estidama Target' },
];

const partners = [
  { name: 'Jacobs', role: 'Architecture' },
  { name: 'Kettle Collective', role: 'Interior Design' },
];

export function Developer() {
  const trackRef = useSectionTracking('developer');

  return (
    <section ref={trackRef} className="py-24 lg:py-32 bg-[#fafafa]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Developed By</p>
            <Image src="/images/sei/aldar-logo.webp" alt="Aldar Properties" width={160} height={50} className="mb-6" />
            <h2 className="text-3xl md:text-4xl text-[#0a0a0a] font-light mb-6">Abu Dhabi&apos;s <span className="font-semibold">Leading Developer</span></h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Aldar Properties is the leading real estate developer in Abu Dhabi, with a reputation for delivering iconic destinations. Sei Saadiyat is targeting Estidama Pearl 3, with smart community features and EV provisions.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {achievements.map((item, index) => (
                <div key={index} className="text-center p-4 bg-white rounded-xl border border-gray-100">
                  <item.icon className="w-5 h-5 text-[#c9a962] mx-auto mb-2" />
                  <p className="text-xl font-bold text-[#0a0a0a]">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              {partners.map((partner, index) => (
                <div key={index} className="flex items-center gap-3 bg-[#0a0a0a] text-white px-4 py-3 rounded-lg">
                  <div>
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-xs text-white/60">{partner.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <Image src="/images/sei/sei-exterior-1.jpeg" alt="SEI Saadiyat Development" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <Image src="/images/sei/sei_saadiyat_logo_light_en.webp" alt="SEI Saadiyat" width={140} height={50} className="h-8 w-auto mb-2" />
                <p className="text-white/60 text-sm">静 • Stillness and Calm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
