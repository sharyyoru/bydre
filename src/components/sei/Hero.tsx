'use client';

import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { useVideoTracking } from '@/hooks/sei/useVideoTracking';

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoTracking(videoRef);

  const handleRegisterClick = () => {
    const form = document.getElementById('register');
    form?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-screen py-28 lg:py-32">
          
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
              <span className="w-2 h-2 bg-[#c9a962] rounded-full animate-pulse" />
              <span className="text-white/70 text-sm tracking-wide">Saadiyat Island, Abu Dhabi</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-light tracking-tight leading-[1.1] mb-6">
              Move Into
              <br />
              <span className="font-semibold text-[#c9a962]">Stillness</span>
            </h1>
            
            <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-4 max-w-xl mx-auto lg:mx-0">
              <span className="text-white/80 italic">Sei</span> — stillness and calm in Japanese. 
              778 homes across six towers in Saadiyat Cultural District.
            </p>
            <p className="text-white/40 text-sm mb-8 max-w-xl mx-auto lg:mx-0">
              Architecture by Jacobs • Interiors by Kettle Collective
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-10">
              <div className="text-center lg:text-left">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Starting From</p>
                <p className="text-3xl md:text-4xl font-semibold text-white">AED 2.95M</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white/10 mx-4" />
              <div className="text-center lg:text-left">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Payment Plan</p>
                <p className="text-3xl md:text-4xl font-semibold text-[#c9a962]">50/50</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button 
                onClick={handleRegisterClick} 
                size="lg"
                className="w-full sm:w-auto bg-[#c9a962] hover:bg-[#b8984f] text-black font-semibold px-8 group"
              >
                Register Your Interest
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="relative aspect-[9/16] max-h-[70vh] lg:max-h-[80vh] mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/videos/sei/hero.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <button 
                onClick={handleRegisterClick}
                className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 bg-[#c9a962] hover:bg-[#b8984f] text-black font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Register Your Interest
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1419] to-[#0a0a0a]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c9a962]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#c9a962]/3 rounded-full blur-[100px]" />
      </div>
    </section>
  );
}
