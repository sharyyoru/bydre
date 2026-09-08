'use client';

import { useSectionTracking } from '@/hooks/sei/useTracking';

const distances = [
  { name: 'Abu Dhabi City Centre', time: '12', highlight: false },
  { name: 'Abu Dhabi Corniche', time: '12', highlight: false },
  { name: 'Al Reem Island', time: '12', highlight: false },
  { name: 'Yas Island', time: '20', highlight: false },
  { name: 'Zayed International Airport', time: '25', highlight: true },
  { name: 'Dubai International Airport', time: '85', highlight: true },
];

const culturalLandmarks = ['Louvre Abu Dhabi', 'Guggenheim Abu Dhabi', 'Zayed National Museum', 'Natural History Museum', 'teamLab Phenomena', 'Saadiyat Grove'];

const amenityCategories = [
  { title: 'BREATHE', items: ['Zen Garden', 'Serenity Pool', 'Pod Garden', 'Landscaped Courtyards'] },
  { title: 'MOVE', items: ['3 Indoor Gyms', 'Outdoor Fitness', 'Sports Courts', 'Aerial Yoga Studio'] },
  { title: 'RESTORE', items: ['Spa & Sauna', 'Hot & Cold Pools', 'Treatment Rooms', 'Outdoor Yoga Decks'] },
  { title: 'CONNECT', items: ['Rooftop Pools', 'Cinema Rooms', 'Co-Working Spaces', 'Kids Club'] },
];

export function Location() {
  const trackRef = useSectionTracking('location');

  return (
    <section id="location" ref={trackRef} className="py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Saadiyat Cultural District</p>
          <h2 className="text-4xl md:text-5xl text-[#0a0a0a] font-light mb-6">Set in the Heart of <span className="font-semibold">Culture</span></h2>
          <p className="text-gray-600 text-lg">Moments from Abu Dhabi&apos;s most celebrated cultural landmarks.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {distances.map((item, index) => (
            <div key={index} className={`text-center p-6 rounded-2xl ${item.highlight ? 'bg-[#0a0a0a] text-white' : 'bg-[#fafafa] border border-gray-100'}`}>
              <p className={`text-4xl font-bold mb-1 ${item.highlight ? 'text-[#c9a962]' : 'text-[#0a0a0a]'}`}>{item.time}</p>
              <p className={`text-xs uppercase tracking-wider ${item.highlight ? 'text-white/60' : 'text-gray-500'}`}>min</p>
              <p className={`text-sm mt-2 ${item.highlight ? 'text-white/80' : 'text-gray-600'}`}>{item.name}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0a0a0a] rounded-3xl p-8 lg:p-12 mb-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-3">Within Reach</p>
              <h3 className="text-2xl lg:text-3xl text-white font-light">World-Class <span className="font-semibold">Cultural Institutions</span></h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {culturalLandmarks.map((landmark, index) => (
                <span key={index} className="px-4 py-2 bg-white/10 text-white/80 rounded-full text-sm">{landmark}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-center mb-12">
            <p className="text-[#c9a962] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Take a Moment for Yourself</p>
            <h3 className="text-3xl md:text-4xl text-[#0a0a0a] font-light">Where Stillness <span className="font-semibold">Takes Root</span></h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {amenityCategories.map((category, index) => (
              <div key={index} className="bg-[#fafafa] rounded-2xl p-6 border border-gray-100 hover:border-[#c9a962]/30 transition-colors">
                <h4 className="text-[#c9a962] text-sm font-bold tracking-[0.2em] mb-4">{category.title}</h4>
                <ul className="space-y-3">
                  {category.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-600">
                      <div className="w-1.5 h-1.5 bg-[#c9a962] rounded-full" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
