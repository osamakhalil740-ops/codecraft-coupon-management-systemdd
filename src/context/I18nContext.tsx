'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, type Language, type Translations } from '../locales/index';
import { logger } from '../utils/logger';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'en'
  );
  const [currentTranslations, setCurrentTranslations] = useState<Translations | null>(null);
  const [loading, setLoading] = useState(true);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    localStorage.setItem('language', language);

    const loadTranslations = () => {
        setLoading(true);
        try {
            // Use statically imported translations
            const data = translations[language] || translations.en;
            setCurrentTranslations(data);
        } catch (error) {
            logger.error("Failed to load translations:", error);
            // Fallback to English
            setCurrentTranslations(translations.en);
        } finally {
            setLoading(false);
        }
    };

    loadTranslations();
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
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Translations...</div>
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};
