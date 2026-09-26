import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, SUPPORTED_LANGUAGES, t } from './translations.ts';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  dict: typeof t['ms'];
}

function createSafeDict(currentLang: Language): typeof t['ms'] {
  const current = (t[currentLang] || t.ms) as Record<string, string>;
  const fallback = t.ms as Record<string, string>;
  return new Proxy(current, {
    get(target, prop: string) {
      if (prop in target && target[prop] !== undefined) {
        return target[prop];
      }
      if (prop in fallback && fallback[prop] !== undefined) {
        return fallback[prop];
      }
      return '';
    },
  }) as typeof t['ms'];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ms',
  setLang: () => {},
  dict: createSafeDict('ms'),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('pintar_language') as Language;
    if (saved && (saved === 'ms' || saved === 'en' || saved === 'zh' || saved === 'ta')) {
      return saved;
    }
    return 'ms'; // Default to Bahasa Melayu
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('pintar_language', newLang);
  };

  const dict = createSafeDict(lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, dict }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
