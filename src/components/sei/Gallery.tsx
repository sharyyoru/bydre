'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSectionTracking } from '@/hooks/sei/useTracking';

const galleryImages = [
  { src: '/images/sei/sei-exterior-1.jpeg', alt: 'SEI Saadiyat Aerial View', category: 'exterior' },
  { src: '/images/sei/sei-exterior-2.jpeg', alt: 'SEI Saadiyat Development', category: 'exterior' },
  { src: '/images/sei/sei-interior-1.jpeg', alt: 'Living Room Interior', category: 'interior' },
  { src: '/images/sei/sei-interior-2.jpeg', alt: 'Bedroom Interior', category: 'interior' },
  { src: '/images/sei/sei-amenity-1.jpeg', alt: 'Pool & Amenities', category: 'amenity' },
  { src: '/images/sei/sei-amenity-2.jpeg', alt: 'Lifestyle Amenities', category: 'amenity' },
];

const categories = ['all', 'exterior', 'interior', 'amenity'];

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useSectionTracking('gallery');

  const filteredImages = activeCategory === 'all' ? galleryImages : galleryImages.filter(img => img.category === activeCategory);

  return (
    <>
      <section ref={trackRef} className="py-24 lg:py-32 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Visual Journey</p>
            <h2 className="text-4xl md:text-5xl text-white font-light mb-6">Experience <span className="font-semibold">Stillness</span></h2>
          </div>

          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {categories.map((category) => (
              <button key={category} onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${activeCategory === category ? 'bg-[#c9a962] text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredImages.map((image, index) => (
              <div key={image.src} onClick={() => { setCurrentIndex(index); setLightboxOpen(true); }}
                className={`relative overflow-hidden rounded-xl cursor-pointer group ${index === 0 ? 'col-span-2 row-span-2' : ''}`}>
                <div className={`relative ${index === 0 ? 'aspect-square' : 'aspect-[4/3]'}`}>
                  <Image src={image.src} alt={image.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes={index === 0 ? '50vw' : '25vw'} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-6 right-6 p-2 text-white/60 hover:text-white"><X className="w-8 h-8" /></button>
          <button onClick={() => setCurrentIndex((currentIndex - 1 + filteredImages.length) % filteredImages.length)} className="absolute left-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button>
          <div className="relative w-full max-w-5xl max-h-[80vh] mx-16">
            <Image src={filteredImages[currentIndex].src} alt={filteredImages[currentIndex].alt} width={1200} height={800} className="object-contain w-full h-full" />
          </div>
          <button onClick={() => setCurrentIndex((currentIndex + 1) % filteredImages.length)} className="absolute right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><ChevronRight className="w-6 h-6" /></button>
        </div>
      )}
    </>
  );
}
