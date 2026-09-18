"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type Locale,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  detectLocale,
  t as translate,
  translateError,
  type TranslateVars,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TranslateVars) => string;
  /** Translate an API / client error message for display. */
  te: (message: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  te: (message) => message,
});

export function useI18n() {
  return useContext(I18nContext);
}

/** Shorthand: just the translate function bound to current locale. */
export function useT() {
  const { t } = useContext(I18nContext);
  return t;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dc-locale") as Locale | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      setLocaleState(stored);
    } else {
      setLocaleState(detectLocale());
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("dc-locale", l);
    // Update <html lang=""> for SEO + browser auto-translate hints
    document.documentElement.lang = l === "zh-TW" ? "zh-Hant" : l === "zh-CN" ? "zh-Hans" : "en";
  }, []);

  const t = useCallback(
    (key: string, vars?: TranslateVars) => translate(key, locale, vars),
    [locale]
  );
  const te = useCallback(
    (message: string) => translateError(message, locale),
    [locale]
  );

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider
        value={{
          locale: "en",
          setLocale,
          t: (key, vars) => translate(key, "en", vars),
          te: (message) => message,
        }}
      >
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, te }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Language selector dropdown — compact, for navbar use.
 */
export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="px-1.5 py-1 rounded-md border bg-background text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[36px]"
      aria-label="Language"
      title="Language"
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
