'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translate } from './data';

type Lang = 'en' | 'gr';
type LangValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Record<string, string>;
};

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Restore saved language on mount (kept out of initial render to avoid hydration mismatch).
  useEffect(() => {
    const saved = localStorage.getItem('nommar_lang');
    if (saved === 'en' || saved === 'gr') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('nommar_lang', l);
    } catch {
      /* ignore */
    }
  };

  const t = translate(lang) as Record<string, string>;
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within <LangProvider>');
  return ctx;
}
