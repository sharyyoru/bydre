'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: 'services', label: 'Services' },
  { href: 'properties', label: 'Properties' },
  { href: 'about', label: 'About' },
  { href: 'register', label: 'Contact' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegisterClick = () => {
    const form = document.getElementById('register');
    form?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-slate-900/98 backdrop-blur-md py-3 shadow-xl'
          : 'bg-gradient-to-b from-black/80 to-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/landing" className="text-2xl font-bold text-white">
            Dre<span className="text-amber-500">Homes</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-white/80 hover:text-white text-sm font-medium tracking-wider uppercase transition-colors duration-300"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRegisterClick}
              className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Get Started
            </button>
            <Link
              href="/login"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Login
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-slate-900 border-t border-white/10 px-4 py-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-white/80 hover:text-white text-left py-2 uppercase text-sm tracking-wider"
                >
                  {link.label}
                </button>
              ))}
              <button 
                onClick={handleRegisterClick} 
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 rounded-lg"
              >
                Get Started
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
