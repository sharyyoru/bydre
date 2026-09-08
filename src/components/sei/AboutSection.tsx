'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { useSectionTracking } from '@/hooks/sei/useTracking';

export function AboutSection() {
  const trackRef = useSectionTracking('about');

  const handleLearnMore = () => {
    const units = document.getElementById('units');
    units?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="about" ref={trackRef} className="py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              Homes That Let Life Breathe
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-[#0a0a0a] font-light mb-6 leading-tight">
              A Balance of
              <br />
              <span className="font-semibold">Space & Light</span>
            </h2>
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed mb-8">
              <p>
                At Sei Saadiyat, stillness becomes part of everyday life. Set within 
                Saadiyat Cultural District, the collection includes 1 and 2-bedroom 
                apartments, signature 3-bedroom Kanso Residences, and 2-bedroom Kanso Lofts 
                with double-height living spaces.
              </p>
              <p>
                Thoughtful architecture by <strong>Jacobs</strong>, warm interiors by <strong>Kettle 
                Collective</strong>, landscaped spaces and open views create a sense of calm, 
                balance and ease.
              </p>
            </div>
            <Button 
              onClick={handleLearnMore} 
              size="lg"
              className="bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white group"
            >
              Explore Residences
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="order-1 lg:order-2 relative">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/sei/sei-interior-1.jpeg"
                alt="SEI Saadiyat Interior"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 lg:-bottom-6 lg:-left-6 bg-[#0a0a0a] text-white p-6 rounded-xl shadow-xl">
              <p className="text-3xl font-semibold">Q4 2030</p>
              <p className="text-sm text-white/60 tracking-wide">Expected Handover</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
