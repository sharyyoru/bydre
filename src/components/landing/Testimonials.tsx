'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Ahmed Al Maktoum',
    role: 'Property Investor',
    content: 'DreHomes made my investment journey seamless. Their market knowledge and professional approach helped me secure a property with excellent ROI.',
    rating: 5,
  },
  {
    name: 'Sarah Johnson',
    role: 'Homeowner',
    content: 'Finding our dream home in Dubai Marina was effortless with DreHomes. The team understood exactly what we were looking for.',
    rating: 5,
  },
  {
    name: 'Raj Patel',
    role: 'Business Owner',
    content: 'Excellent service from start to finish. They handled everything from property search to documentation. Highly recommended!',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            Client Stories
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Our Clients Say
          </h2>
          <p className="text-white/60">
            Don&apos;t just take our word for it. Here&apos;s what our satisfied clients have to say.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8 relative"
            >
              <Quote className="w-10 h-10 text-amber-500/20 absolute top-6 right-6" />
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-white/70 mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </p>
              <div>
                <p className="text-white font-semibold">{testimonial.name}</p>
                <p className="text-white/50 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
