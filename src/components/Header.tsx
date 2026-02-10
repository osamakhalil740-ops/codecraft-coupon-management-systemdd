'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/I18nContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import KobonzLogo from '@/components/KobonzLogo';

export default function Header() {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const toggleLanguage = (lang: 'en' | 'ar') => {
    setLanguage(lang);
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <nav className="container mx-auto px-4 py-4" aria-label="Global">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <KobonzLogo />
              <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Kobonz
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8 items-center">
            <Link href="/marketplace" className="text-sm font-medium leading-6 text-gray-600 hover:text-brand-primary transition-colors">
              {t('nav.marketplace') || 'Marketplace'}
            </Link>
            <Link href="/locations" className="text-sm font-medium leading-6 text-gray-600 hover:text-brand-primary transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              {t('nav.locations') || 'Locations'}
            </Link>
          </div>

          {/* Right Section: Language + Auth */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6 items-center">
            {/* Language Switcher */}
            <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <button
                onClick={() => toggleLanguage('en')}
                className={`px-1.5 py-0.5 rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-blue-100 text-blue-700' : 'hover:text-gray-900 text-gray-400'}`}
              >
                EN
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => toggleLanguage('ar')}
                className={`px-1.5 py-0.5 rounded text-xs font-bold transition-all ${language === 'ar' ? 'bg-blue-100 text-blue-700' : 'hover:text-gray-900 text-gray-400'}`}
              >
                ع
              </button>
            </div>

            <Link href="/auth/login" className="text-sm font-semibold leading-6 text-gray-900 transition-colors">
              Login / Signup
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4">
            <div className="space-y-2">
              <Link
                href="/marketplace"
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.marketplace') || 'Marketplace'}
              </Link>
              <Link
                href="/locations"
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.locations') || 'Locations'}
              </Link>

              {/* Mobile Language Switcher */}
              <div className="py-2 px-3 flex items-center gap-4">
                <button
                  onClick={() => toggleLanguage('en')}
                  className={`text-sm font-bold ${language === 'en' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  English
                </button>
                <button
                  onClick={() => toggleLanguage('ar')}
                  className={`text-sm font-bold ${language === 'ar' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  العربية
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <Link
                  href="/auth/login"
                  className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login / Signup
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
