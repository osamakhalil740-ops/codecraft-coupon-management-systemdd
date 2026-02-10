'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, type Language, type Translations } from '../../locales/index';
import { logger } from '../../utils/logger';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('language') as Language) || 'en';
    }
    return 'en';
  });
  
  // Initialize translations synchronously to avoid blocking SSR
  const [currentTranslations, setCurrentTranslations] = useState<Translations>(
    () => translations[language] || translations.en
  );

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
      localStorage.setItem('language', language);
    }

    // Load translations when language changes
    try {
      const data = translations[language] || translations.en;
      setCurrentTranslations(data);
    } catch (error) {
      logger.error("Failed to load translations:", error);
      // Fallback to English
      setCurrentTranslations(translations.en);
    }
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
    if (!currentTranslations) return key;

    const keys = key.split('.');
    let result: unknown = currentTranslations;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key; // Return the key itself if not found
      }
      if (result === undefined) {
        return key; // Return the key itself if not found
      }
    }

    if (typeof result === 'string' && options) {
      return Object.entries(options).reduce((str, [key, value]) => {
        return str.replace(`{{${key}}}`, String(value));
      }, result);
    }

    return (typeof result === 'string' ? result : String(result)) || key;
  }, [currentTranslations]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
