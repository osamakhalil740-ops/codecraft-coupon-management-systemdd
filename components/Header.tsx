import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">CC</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">CodeCraft</span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">CC</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
            <Link to="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
              {t('header.marketplace')}
            </Link>
            
            {/* Desktop Language Switcher */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setLanguage('en')}
                className={'px-2 py-1 text-xs sm:text-sm rounded transition-colors ' + (language === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900')}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={'px-2 py-1 text-xs sm:text-sm rounded transition-colors ' + (language === 'ar' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900')}
              >
                ع
              </button>
            </div>
            
            {!user && (
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
                {t('header.loginSignup')}
              </Link>
            )}
          </nav>

          {/* User Menu for Desktop */}
          {user ? (
            <div className="hidden lg:flex items-center gap-3 xl:gap-4">
              {/* Credits Display */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  {user.roles.includes('shop-owner') ? '🏪' : 
                   user.roles.includes('affiliate') ? '🤝' : 
                   user.roles.includes('admin') ? '👑' : '🎫'}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {user.credits.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 font-medium">{t('common.credits')}</span>
              </div>
              
              <Link
                to="/dashboard"
                className={'text-sm font-medium transition-colors whitespace-nowrap ' + (isSuperAdmin ? 'text-red-600 hover:text-red-800 font-bold' : 'text-gray-600 hover:text-primary')}
              >
                {isSuperAdmin ? '👑 Super Admin' :
                 user.roles.includes('shop-owner') ? 'Business Hub' :
                 user.roles.includes('affiliate') ? 'Marketing Hub' :
                 user.roles.includes('admin') ? 'Admin Panel' : 'My Deals'}
              </Link>
              
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:shadow-lg hover:opacity-90 transition-all transform hover:scale-105 whitespace-nowrap"
              >
                {t('header.logout')}
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {t('header.loginSignup')}
              </Link>
            </div>
          )}

          {/* Mobile Menu Button and Credits */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Credits Display */}
            {user && (
              <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-gray-200 px-2 py-1 rounded-full shadow-sm">
                <span className="text-xs font-bold text-gray-800">
                  {user.credits.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 font-medium">{t('common.credits')}</span>
              </div>
            )}
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-5 w-5" />
              ) : (
                <Bars3Icon className="block h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg">
              {/* Mobile Navigation Links */}
              <Link
                to="/marketplace"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={closeMobileMenu}
              >
                {t('header.marketplace')}
              </Link>

              {/* Mobile Language Switcher */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Language:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        closeMobileMenu();
                      }}
                      className={'px-3 py-1 text-sm rounded transition-colors ' + (language === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 bg-gray-100')}
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('ar');
                        closeMobileMenu();
                      }}
                      className={'px-3 py-1 text-sm rounded transition-colors ' + (language === 'ar' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 bg-gray-100')}
                    >
                      العربية
                    </button>
                  </div>
                </div>
              </div>

              {user ? (
                <>
                  {/* Mobile User Menu */}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <Link
                      to="/dashboard"
                      className={'block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-50 ' + (isSuperAdmin ? 'text-red-600 hover:text-red-800' : 'text-gray-600 hover:text-gray-900')}
                      onClick={closeMobileMenu}
                    >
                      {isSuperAdmin ? '👑 Super Admin' :
                       user.roles.includes('shop-owner') ? 'Business Dashboard' :
                       user.roles.includes('affiliate') ? 'Marketing Dashboard' :
                       user.roles.includes('admin') ? 'Admin Dashboard' : 'My Dashboard'}
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary hover:opacity-90 transition-opacity text-center"
                    onClick={closeMobileMenu}
                  >
                    {t('header.loginSignup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
