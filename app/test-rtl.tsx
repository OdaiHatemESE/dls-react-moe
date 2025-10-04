'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';

export default function RTLTest() {
  const [locale, setLocale] = React.useState<'en' | 'ar'>('en');

  return (
    <div className={clsx("p-8 min-h-screen", locale === 'ar' && 'direction-rtl')}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Language Toggle */}
        <div className="text-center">
          <button
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Switch to {locale === 'en' ? 'Arabic' : 'English'}
          </button>
          <p className="mt-2 text-sm text-gray-600">Current: {locale === 'en' ? 'English (LTR)' : 'Arabic (RTL)'}</p>
        </div>

        {/* Test Card with Icons */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">RTL Spacing Test</h2>
          
          {/* Icons with me-2 (margin-inline-end) */}
          <div className="space-y-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 me-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Icon with me-2 (margin-inline-end)</span>
            </div>

            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full me-2"></div>
              <span>Dot with me-2 spacing</span>
            </div>

            {/* Badge with icon */}
            <Badge variant="outline" className="inline-flex items-center">
              <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Badge with icon
            </Badge>

            {/* Container with ms-4 (margin-inline-start) */}
            <div className="border-l-4 border-primary ms-4 ps-4">
              <p>This content has ms-4 (margin-inline-start) and ps-4 (padding-inline-start)</p>
            </div>
          </div>
        </Card>

        {/* Breadcrumb Test */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Breadcrumb Navigation Test</h2>
          <nav className="flex items-center space-x-2 rtl:space-x-reverse">
            <a href="#" className="inline-flex items-center text-primary hover:underline">
              <svg className={clsx("w-4 h-4 me-2", locale === 'ar' && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </a>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
            <span className="text-gray-900">
              {locale === 'ar' ? 'ملف الطالب' : 'Student Profile'}
            </span>
          </nav>
        </Card>

        {/* Text Alignment Test */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Text Alignment Test</h2>
          <div className={clsx("space-y-4", locale === 'ar' ? 'text-right' : 'text-left')}>
            <p>This paragraph should be {locale === 'ar' ? 'right-aligned in Arabic' : 'left-aligned in English'}.</p>
            <div className={clsx("flex flex-wrap items-center gap-3", 
              locale === 'ar' ? 'justify-end' : 'justify-start'
            )}>
              <Badge>First Badge</Badge>
              <Badge>Second Badge</Badge>
              <Badge>Third Badge</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}