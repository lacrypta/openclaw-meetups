import { useState, type ReactNode } from 'react';
import { LanguageContext, type Language } from './context';
import { es } from './es';
import { en } from './en';
import type { Translations } from './types';

const translations: Record<Language, Translations> = { es, en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('openclaw-lang');
    if (saved === 'en' || saved === 'es') return saved;
    return navigator.language.startsWith('en') ? 'en' : 'es';
  });

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
