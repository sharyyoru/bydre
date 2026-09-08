'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, MapPin, Building2, Users, Award, Phone, Mail, Loader2 } from 'lucide-react';

const services = [
  { icon: Building2, title: 'Property Sales', description: 'Premium off-plan and ready properties across UAE' },
  { icon: Users, title: 'Investment Advisory', description: 'Expert guidance on real estate investments' },
  { icon: Award, title: 'Property Management', description: 'End-to-end property management solutions' },
];

const stats = [
  { value: '500+', label: 'Properties Sold' },
  { value: 'AED 2B+', label: 'Transaction Value' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '15+', label: 'Years Experience' },
];

export default function LandingPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    interest: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/public-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lead_source: 'landing_page',
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            Dre<span className="text-amber-500">Homes</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-white/70 hover:text-white transition-colors">Services</a>
            <a href="#about" className="text-white/70 hover:text-white transition-colors">About</a>
            <a href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</a>
          </nav>
          <Link 
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Client Login →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
                Premium Real Estate Solutions
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Your Gateway to <span className="text-amber-500">Luxury Living</span> in UAE
              </h1>
              <p className="text-white/60 text-lg mb-8 max-w-lg">
                Discover exceptional properties and investment opportunities with DreHomes. 
                From off-plan developments to ready homes, we deliver excellence.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-4 rounded-lg transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="#services"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
                >
                  Our Services
                </a>
              </div>
            </div>

            {/* Right - Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div 
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center"
                >
                  <p className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">{stat.value}</p>
                  <p className="text-white/50 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
              What We Offer
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comprehensive Real Estate Services
            </h2>
            <p className="text-white/60">
              From property acquisition to management, we provide end-to-end solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div 
                key={service.title}
                className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 hover:border-amber-500/50 transition-colors group"
              >
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                  <service.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                <p className="text-white/60">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto">
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
                of experts brings unparalleled market knowledge and dedication.
              </p>
              <ul className="space-y-4">
                {['Licensed RERA Brokers', 'Multi-lingual Team', 'VIP Client Services', 'Market Expertise'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-slate-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <MapPin className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-white font-semibold">Headquarters</p>
                  <p className="text-white/60">Dubai, United Arab Emirates</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <Phone className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-white font-semibold">Contact</p>
                  <p className="text-white/60">+971 50 123 4567</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-white font-semibold">Email</p>
                  <p className="text-white/60">info@drehomes.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Lead Capture Section */}
      <section id="contact" className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
              Get In Touch
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Register Your Interest
            </h2>
            <p className="text-white/60">
              Let us help you find the perfect property. Fill out the form and our team will contact you.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 md:p-12">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Thank You!</h3>
                <p className="text-white/60">
                  We&apos;ve received your inquiry. Our team will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="+971 50 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Interest</label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="" className="bg-slate-900">Select Interest</option>
                      <option value="buying" className="bg-slate-900">Buying Property</option>
                      <option value="selling" className="bg-slate-900">Selling Property</option>
                      <option value="investing" className="bg-slate-900">Investment Advice</option>
                      <option value="management" className="bg-slate-900">Property Management</option>
                      <option value="other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Inquiry
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-white/40 text-xs text-center">
                  By submitting, you agree to receive communications from DreHomes regarding your inquiry.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-bold text-white">
              Dre<span className="text-amber-500">Homes</span>
            </div>
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} DreHomes. All rights reserved.
            </p>
            <div className="flex gap-6 text-white/40 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
