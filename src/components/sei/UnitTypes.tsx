'use client';

import { useState } from 'react';
import { BedDouble, Bath, Maximize, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { RegistrationForm } from './RegistrationForm';
import { useSectionTracking } from '@/hooks/sei/useTracking';

const units = [
  { type: '1-Bedroom Apartment', startingPrice: 'AED 2.95M', bedrooms: 1, bathrooms: 1, size: '70 m²', description: 'Thoughtfully designed spaces with natural light and calm interiors.' },
  { type: '2-Bedroom Apartment', startingPrice: 'AED 4.5M', bedrooms: 2, bathrooms: 2, size: '120 m²', description: 'Spacious layouts balancing minimalism with warmth and character.' },
  { type: '2-Bed + Maid\'s Room', startingPrice: 'AED 5.4M', bedrooms: 2, bathrooms: 3, size: '145 m²', description: 'Enhanced living with dedicated staff quarters and flexible spaces.' },
  { type: '3-Bed Kanso Residence', startingPrice: 'AED 8.4M', bedrooms: 3, bathrooms: 4, size: '208 m²', description: 'Signature residences shaped by stillness, space and natural materials.', featured: true },
  { type: '2-Bed Kanso Loft', startingPrice: 'AED 7.5M', bedrooms: 2, bathrooms: 3, size: '180 m²', description: 'Double-height living with elevated bedrooms and expansive windows.', featured: true },
];

export function UnitTypes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const trackRef = useSectionTracking('units');

  return (
    <>
      <section id="units" ref={trackRef} className="py-24 lg:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Simplicity by Design</p>
            <h2 className="text-4xl md:text-5xl text-[#0a0a0a] font-light mb-6">
              Homes That Let <span className="font-semibold">Life Breathe</span>
            </h2>
            <p className="text-gray-600 text-lg">
              From 1-bedroom apartments to signature Kanso Lofts, each residence reflects a design philosophy that finds beauty in balance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {units.map((unit, index) => (
              <div key={index} className={`relative bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 hover:border-[#c9a962]/30 transition-all duration-300 hover:shadow-xl group ${unit.featured ? 'ring-2 ring-[#c9a962]' : ''}`}>
                {unit.featured && (
                  <span className="absolute -top-3 left-6 bg-[#c9a962] text-black text-xs font-semibold px-4 py-1 rounded-full">Premium</span>
                )}
                <h3 className="text-2xl font-semibold text-[#0a0a0a] mb-2">{unit.type}</h3>
                <p className="text-[#c9a962] text-xl font-semibold mb-4">Starting from {unit.startingPrice}</p>
                <p className="text-gray-500 text-sm mb-6">{unit.description}</p>
                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <BedDouble className="w-4 h-4 text-[#c9a962]" /><span>{unit.bedrooms} Bed</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Bath className="w-4 h-4 text-[#c9a962]" /><span>{unit.bathrooms} Bath</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Maximize className="w-4 h-4 text-[#c9a962]" /><span>{unit.size}</span>
                  </div>
                </div>
                <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="w-full bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] font-medium">
                  <Lock className="w-4 h-4 mr-2" />View Full Details
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="bg-[#c9a962] hover:bg-[#b8984f] text-black font-semibold">
              Unlock Full Pricing
            </Button>
          </div>
        </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Get Exclusive Pricing">
        <p className="text-gray-600 mb-6">Register your interest to receive detailed pricing, floor plans, and exclusive access to unit selection.</p>
        <RegistrationForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
