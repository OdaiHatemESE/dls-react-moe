"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

type Locale = "en" | "ar";

type Dictionaries = {
  en: typeof en;
  ar: typeof ar;
};

const dictionaries: Dictionaries = { en, ar };

type I18nContextType = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: typeof en;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("locale") as Locale) || "en";
  });

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
      // Optional utility class for Tailwind conditional styling if needed
      document.documentElement.classList.toggle("direction-rtl", dir === "rtl");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale);
    }
  }, [locale, dir]);

  const t = useMemo(() => dictionaries[locale], [locale]);

  const value = useMemo(() => ({ locale, dir, t, setLocale }), [locale, dir, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
