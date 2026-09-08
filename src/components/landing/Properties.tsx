'use client';

import { MapPin, Bed, Bath, Maximize } from 'lucide-react';

const properties = [
  {
    title: 'Palm Jumeirah Villa',
    location: 'Palm Jumeirah, Dubai',
    price: 'AED 15,000,000',
    beds: 5,
    baths: 6,
    sqft: '8,500',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    tag: 'Featured',
  },
  {
    title: 'Downtown Penthouse',
    location: 'Downtown Dubai',
    price: 'AED 8,500,000',
    beds: 4,
    baths: 5,
    sqft: '5,200',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    tag: 'New',
  },
  {
    title: 'Marina Skyline Apt',
    location: 'Dubai Marina',
    price: 'AED 3,200,000',
    beds: 2,
    baths: 3,
    sqft: '2,100',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    tag: 'Hot Deal',
  },
  {
    title: 'Saadiyat Beach Villa',
    location: 'Saadiyat Island, Abu Dhabi',
    price: 'AED 12,000,000',
    beds: 6,
    baths: 7,
    sqft: '9,000',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    tag: 'Exclusive',
  },
];

export function Properties() {
  const handleRegisterClick = () => {
    const form = document.getElementById('register');
    form?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="properties" className="py-24 bg-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            Featured Listings
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Exclusive Properties
          </h2>
          <p className="text-white/60">
            Handpicked luxury properties in prime locations across the UAE.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property) => (
            <div
              key={property.title}
              className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all group cursor-pointer"
              onClick={handleRegisterClick}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-full">
                  {property.tag}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-1">{property.title}</h3>
                <div className="flex items-center gap-1 text-white/50 text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  {property.location}
                </div>
                <p className="text-2xl font-bold text-amber-500 mb-4">{property.price}</p>
                <div className="flex items-center gap-4 text-white/60 text-sm border-t border-white/10 pt-4">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {property.beds}
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.baths}
                  </div>
                  <div className="flex items-center gap-1">
                    <Maximize className="w-4 h-4" />
                    {property.sqft} sqft
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={handleRegisterClick}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-4 rounded-lg transition-colors"
          >
            View All Properties
          </button>
        </div>
      </div>
    </section>
  );
}
