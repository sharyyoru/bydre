'use client';

import { Building2, TrendingUp, Key, FileText, Users, Headphones } from 'lucide-react';

const services = [
  {
    icon: Building2,
    title: 'Property Sales',
    description: 'Premium off-plan and ready properties across Dubai and Abu Dhabi from top developers.',
  },
  {
    icon: TrendingUp,
    title: 'Investment Advisory',
    description: 'Expert guidance on real estate investments with detailed ROI analysis and market insights.',
  },
  {
    icon: Key,
    title: 'Property Management',
    description: 'End-to-end property management including tenant sourcing, maintenance, and rent collection.',
  },
  {
    icon: FileText,
    title: 'Mortgage Assistance',
    description: 'We connect you with leading banks for the best mortgage rates and financing options.',
  },
  {
    icon: Users,
    title: 'Resale Properties',
    description: 'Access to exclusive secondary market listings with competitive pricing.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated relationship managers available round the clock for all your queries.',
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            What We Offer
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comprehensive Real Estate Services
          </h2>
          <p className="text-white/60">
            From property search to investment management, we provide end-to-end solutions for your real estate needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 hover:border-amber-500/50 transition-all group"
            >
              <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                <service.icon className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
              <p className="text-white/60">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
