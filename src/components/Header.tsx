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
  const { t } = useTranslation();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="container mx-auto px-4 py-4" aria-label="Global">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href=\"/\" className=\"-m-1.5 p-1.5 flex items-center gap-2\">
              <KobonzLogo />
              <span className=\"text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent\">
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
          <div className=\"hidden lg:flex lg:gap-x-8\">
            <Link href=\"/\" className=\"text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary transition-colors\">
              {t('nav.home')}
            </Link>
            <Link href=\"/coupons\" className=\"text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary transition-colors\">
              {t('nav.coupons')}
            </Link>
            <Link href=\"/stores\" className=\"text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary transition-colors\">
              {t('nav.stores')}
            </Link>
            <Link href=\"/locations\" className=\"text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary transition-colors\">
              {t('nav.locations')}
            </Link>
          </div>

          {/* Auth buttons */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4">
            <div className="space-y-2">
              <Link
                href="/"
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/coupons"
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.coupons')}
              </Link>
              <Link
                href="/stores"
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.stores')}
              </Link>
              <Link
                href="/locations"
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.locations')}
              </Link>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      href="/auth/register"
                      className="btn-primary block text-center mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
