'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSectionTracking } from '@/hooks/sei/useTracking';
import { cn } from '@/lib/utils';

const faqs = [
  { question: 'What is SEI Saadiyat?', answer: 'SEI Saadiyat is a premium residential development by Aldar Properties on Saadiyat Island, Abu Dhabi. It comprises 6 residential towers with 778 luxury residences.' },
  { question: 'What is the starting price?', answer: 'Prices at SEI Saadiyat start from AED 2.95 million for a 1-bedroom residence.' },
  { question: 'What payment plan is available?', answer: 'SEI Saadiyat offers a 50/50 payment plan. Pay 50% during construction and 50% on handover.' },
  { question: 'When is the expected handover?', answer: 'The expected handover for SEI Saadiyat is Q4 2030.' },
  { question: 'Where is SEI Saadiyat located?', answer: 'SEI Saadiyat is located on Saadiyat Island, Abu Dhabi\'s premier cultural destination.' },
  { question: 'Can foreign nationals buy property?', answer: 'Yes, Saadiyat Island is a designated freehold area where foreign nationals can purchase property with full ownership rights.' },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const trackRef = useSectionTracking('faq');

  return (
    <section ref={trackRef} className="py-20 lg:py-32 bg-stone-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-700 text-sm tracking-[0.2em] uppercase mb-4">Frequently Asked</p>
            <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mb-6">Questions & Answers</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex items-center justify-between p-6 text-left hover:bg-stone-50 transition-colors">
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown className={cn('w-5 h-5 text-amber-700 flex-shrink-0 transition-transform duration-300', openIndex === index && 'rotate-180')} />
                </button>
                <div className={cn('overflow-hidden transition-all duration-300', openIndex === index ? 'max-h-96' : 'max-h-0')}>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
