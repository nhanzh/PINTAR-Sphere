import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, SUPPORTED_LANGUAGES, t } from './translations.ts';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  dict: typeof t['ms'];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ms',
  setLang: () => {},
  dict: t.ms,
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

  const dict = t[lang] || t.ms;

  return (
    <LanguageContext.Provider value={{ lang, setLang, dict }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
