"use client";

import { useState, useEffect, type ReactNode } from 'react';
import { LanguageContext, type Language } from './context';
import { es } from './es';
import { en } from './en';
import type { Translations } from './types';

const translations: Record<Language, Translations> = { es, en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('es');

  useEffect(() => {
    const saved = localStorage.getItem('openclaw-lang');
    if (saved === 'en' || saved === 'es') {
      setLangState(saved);
    } else if (navigator.language.startsWith('en')) {
      setLangState('en');
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('openclaw-lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}
