'use client';

import { useI18n } from '@/app/i18n/I18nProvider';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { locale } = useI18n();
  
  return (
    <div className={`${locale === 'ar' ? 'lg:pr-72' : 'lg:pl-72'}`}>
      <main className="min-h-screen">{children}</main>
    </div>
  );
}