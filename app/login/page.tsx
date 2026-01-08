"use client";

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/app/i18n/I18nProvider';
import clsx from 'clsx';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const { t, locale } = useI18n();

  // If user lands on this page, immediately redirect to the OIDC provider
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl') || '/';
    signIn('oidc', { callbackUrl });
  }, []);

  return (
    <div className={clsx("min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", locale === 'ar' && 'direction-rtl')}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t.login.title}</h1>
          <p className="mt-2 text-gray-600">{t.login.subtitle}</p>
        </div>

        <Card className="mt-8">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4">
                <svg className="animate-spin h-12 w-12 mx-auto text-aegold-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">Redirecting to login...</p>
              <p className="mt-2 text-sm text-gray-600">Please wait while we redirect you to the authentication page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
