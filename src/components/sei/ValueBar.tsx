'use client';

import { Building2, Home, Maximize, Wallet, Calendar, Percent } from 'lucide-react';
import { useSectionTracking } from '@/hooks/sei/useTracking';

const stats = [
  { icon: Building2, value: '6', label: 'Towers' },
  { icon: Home, value: '778', label: 'Homes' },
  { icon: Maximize, value: '70-208', label: 'm² sizes' },
  { icon: Calendar, value: 'Q4 2030', label: 'Handover' },
  { icon: Percent, value: '5%', label: 'Down Payment' },
  { icon: Wallet, value: '50/50', label: 'Payment Plan' },
];

export function ValueBar() {
  const trackRef = useSectionTracking('value_bar');

  return (
    <section ref={trackRef} className="bg-[#0a0a0a] border-y border-white/5 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#c9a962]/10 flex items-center justify-center hidden sm:flex">
                <stat.icon className="w-5 h-5 text-[#c9a962]" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-semibold text-white">{stat.value}</p>
                <p className="text-sm text-white/50 tracking-wide">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
