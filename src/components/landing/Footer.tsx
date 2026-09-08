'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Linkedin, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link href="/landing" className="text-2xl font-bold mb-6 block">
              Dre<span className="text-amber-500">Homes</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Your trusted partner for premium real estate services in the UAE.
              Helping you find your dream property since 2009.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-white/50">
              <li>
                <a href="#services" className="hover:text-amber-500 transition-colors">Services</a>
              </li>
              <li>
                <a href="#properties" className="hover:text-amber-500 transition-colors">Properties</a>
              </li>
              <li>
                <a href="#about" className="hover:text-amber-500 transition-colors">About Us</a>
              </li>
              <li>
                <a href="#register" className="hover:text-amber-500 transition-colors">Contact</a>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-500 transition-colors">Client Portal</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Services</h4>
            <ul className="space-y-3 text-white/50">
              <li><a href="#" className="hover:text-amber-500 transition-colors">Property Sales</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Investment Advisory</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Property Management</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Mortgage Assistance</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Resale Properties</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <ul className="space-y-4 text-white/50">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Business Bay, Dubai, United Arab Emirates</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span>+971 50 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span>info@drehomes.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
            <p>© {new Date().getFullYear()} DreHomes. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-amber-500 transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
