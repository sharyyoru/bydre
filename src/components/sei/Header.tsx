'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: 'about', label: 'About' },
  { href: 'units', label: 'Residences' },
  { href: 'payment', label: 'Payment Plan' },
  { href: 'location', label: 'Location' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/sei';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegisterClick = () => {
    if (isHomePage) {
      const form = document.getElementById('register');
      form?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/sei#register');
    }
  };

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (isHomePage) {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/sei#${sectionId}`);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-[#0a0a0a]/98 backdrop-blur-md py-3 shadow-xl'
          : 'bg-gradient-to-b from-black/80 to-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/sei" className="relative">
              <Image
                src="/images/sei/sei_saadiyat_logo_light_en.webp"
                alt="SEI Saadiyat"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="hidden md:block h-10 w-px bg-white/20" />
            <Image
              src="/images/sei/aldar-logo.webp"
              alt="Aldar Properties"
              width={90}
              height={36}
              className="hidden md:block h-7 w-auto opacity-90"
            />
          </div>

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
            <Button
              onClick={handleRegisterClick}
              size="sm"
              className="hidden sm:inline-flex bg-[#c9a962] hover:bg-[#b8984f] text-black font-semibold tracking-wide"
            >
              Register Interest
            </Button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-[#0a0a0a] border-t border-white/10 px-4 py-6 shadow-2xl">
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
              <Button onClick={handleRegisterClick} className="mt-4 bg-[#c9a962] hover:bg-[#b8984f] text-black font-semibold">
                Register Interest
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
