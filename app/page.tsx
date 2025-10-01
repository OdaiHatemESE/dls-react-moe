"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingIcon } from './components/icons';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    // Redirect to dashboard as the main entry point
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingIcon className="w-8 h-8 animate-spin" />
        <p className="mt-4 text-gray-600">{t.home.redirecting}</p>
      </div>
    </div>
  );
}
