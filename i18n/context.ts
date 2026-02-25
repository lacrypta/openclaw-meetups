import { createContext } from 'react';
import type { Translations } from './types';

export type Language = 'es' | 'en';

export interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
