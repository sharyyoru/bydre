'use client';

import { Building2, Users, Award, Shield, Globe, TrendingUp } from 'lucide-react';

const stats = [
  { icon: Building2, value: '500+', label: 'Properties Sold' },
  { icon: Users, value: '1,200+', label: 'Happy Clients' },
  { icon: Award, value: '15+', label: 'Years Experience' },
  { icon: Shield, value: 'RERA', label: 'Licensed Broker' },
  { icon: Globe, value: '50+', label: 'Nationalities Served' },
  { icon: TrendingUp, value: '12%', label: 'Avg. ROI' },
];

export function ValueBar() {
  return (
    <section className="bg-slate-800 py-8 border-y border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 justify-center">
              <stat.icon className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
