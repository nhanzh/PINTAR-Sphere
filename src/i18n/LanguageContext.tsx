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
  lang: 'en',
  setLang: () => {},
  dict: createSafeDict('en'),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');

  const setLang = (_newLang: Language) => {
    setLangState('en');
    localStorage.setItem('pintar_language', 'en');
  };

  const dict = createSafeDict('en');

  return (
    <LanguageContext.Provider value={{ lang, setLang, dict }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
