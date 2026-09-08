'use client';

import { ArrowRight } from 'lucide-react';

export function Hero() {
  const handleRegisterClick = () => {
    const form = document.getElementById('register');
    form?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen bg-slate-900 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-screen py-28 lg:py-32">
          
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-white/70 text-sm tracking-wide">Dubai & Abu Dhabi, UAE</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-light tracking-tight leading-[1.1] mb-6">
              Your Gateway to
              <br />
              <span className="font-semibold text-amber-500">Luxury Living</span>
            </h1>
            
            <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-4 max-w-xl mx-auto lg:mx-0">
              Discover exceptional properties and investment opportunities with DreHomes. 
              From off-plan developments to ready homes, we deliver excellence.
            </p>
            <p className="text-white/40 text-sm mb-8 max-w-xl mx-auto lg:mx-0">
              RERA Licensed • 15+ Years Experience • 500+ Properties Sold
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-10">
              <div className="text-center lg:text-left">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Properties From</p>
                <p className="text-3xl md:text-4xl font-semibold text-white">AED 500K</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white/10 mx-4" />
              <div className="text-center lg:text-left">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">ROI Up To</p>
                <p className="text-3xl md:text-4xl font-semibold text-amber-500">12%</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={handleRegisterClick} 
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-2 group"
              >
                Register Your Interest
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleRegisterClick}
                className="w-full sm:w-auto border border-white/20 text-white hover:bg-white hover:text-black font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                View Properties
              </button>
            </div>
          </div>

          {/* Right - Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '500+', label: 'Properties Sold' },
              { value: 'AED 2B+', label: 'Transaction Value' },
              { value: '98%', label: 'Client Satisfaction' },
              { value: '15+', label: 'Years Experience' },
            ].map((stat) => (
              <div 
                key={stat.label}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors"
              >
                <p className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">{stat.value}</p>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/3 rounded-full blur-[100px]" />
      </div>
    </section>
  );
}
