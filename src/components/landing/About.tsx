'use client';

import { CheckCircle, MapPin, Phone, Mail } from 'lucide-react';

export function About() {
  return (
    <section id="about" className="py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
              About DreHomes
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Trusted Real Estate Partner Since 2009
            </h2>
            <p className="text-white/60 mb-6">
              DreHomes has been at the forefront of UAE real estate, helping clients 
              find their dream properties and make smart investment decisions. Our team 
              of experts brings unparalleled market knowledge and dedication to every transaction.
            </p>
            <p className="text-white/60 mb-8">
              Whether you&apos;re looking for a luxury villa, a high-rise apartment, or a 
              profitable investment opportunity, our experienced team is here to guide 
              you every step of the way.
            </p>
            <ul className="space-y-4">
              {[
                'Licensed RERA Brokers',
                'Multi-lingual Team',
                'VIP Client Services',
                'After-Sales Support',
                'Free Property Consultation',
                'Market Expertise',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-500/20 to-slate-800 rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6">Get In Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Office Location</p>
                    <p className="text-white/60">Business Bay, Dubai, UAE</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className="text-white/60">+971 50 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-white/60">info@drehomes.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-amber-500">500+</p>
                  <p className="text-white/50 text-sm">Properties</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-500">98%</p>
                  <p className="text-white/50 text-sm">Satisfaction</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-500">24/7</p>
                  <p className="text-white/50 text-sm">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
