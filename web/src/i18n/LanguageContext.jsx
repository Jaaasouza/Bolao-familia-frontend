import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { I18N } from './strings.js';

// localStorage key — must match the HTML original ('usam_lang').
const STORAGE_KEY = 'usam_lang';

function readInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt') return stored;
  } catch {
    // localStorage may be unavailable (SSR / private mode) — fall through.
  }
  return 'pt';
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  // t(key) — same fallback chain as the HTML's t():
  // I18N[lang][key] ?? I18N.en[key] ?? key
  const t = useCallback(
    (key) => {
      const table = I18N[lang];
      return (table && table[key]) ?? I18N.en[key] ?? key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLang must be used within a LanguageProvider');
  }
  return ctx;
}

export { LanguageContext };
export default LanguageProvider;
