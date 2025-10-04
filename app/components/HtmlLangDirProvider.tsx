'use client';
import { useI18n } from '@/app/i18n/I18nProvider';
import React from 'react';
export default function HtmlLangDirProvider() {
  const { locale, dir } = useI18n();
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);
  return null;
}
