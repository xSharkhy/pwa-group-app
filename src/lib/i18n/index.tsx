import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import ca from './ca.json';
import gl from './gl.json';

export type Locale = 'ca' | 'gl';

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue>;

const translations: Record<Locale, Translations> = { ca, gl };

function getNestedValue(obj: Translations, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path; // Return the path if translation not found
    }
  }

  return typeof value === 'string' ? value : path;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  defaultLocale = 'ca',
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Try to get locale from localStorage
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored && (stored === 'ca' || stored === 'gl')) {
      setLocale(stored);
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = getNestedValue(translations[locale], key);

    // Fallback to Catalan if translation not found
    if (text === key && locale !== 'ca') {
      text = getNestedValue(translations.ca, key);
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function getLocaleFromBrowser(): Locale {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('gl')) return 'gl';
  if (browserLang.startsWith('ca')) return 'ca';

  // Default to Catalan
  return 'ca';
}
