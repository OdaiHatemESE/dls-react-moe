'use client';

import React from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/app/i18n/I18nProvider';
import type { Org, SchoolEnrollment } from '@/types';
import clsx from 'clsx';

type ApiResponse = {
  enrollments: SchoolEnrollment[];
  count: number;
  studentId: string;
  schoolYear: string;
  schoolID?: string | null;
  schoolInfo?: Org | null;
  error?: string;
};

function formatAddress(addresses?: Org['metadata']['addresses']): string {
  if (!addresses || addresses.length === 0) return '';
  const a = addresses[0];
  return [
    a?.addressLine1,
    a?.addressLine2,
    a?.addressLine3,
    a?.city,
    a?.state,
    a?.zipCode,
    a?.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export default function SchoolInfo({ studentId, year }: { studentId: string; year: string }) {
  const { t, locale } = useI18n();
  const { data, error, isLoading } = useSWR<ApiResponse>(
    studentId && year ? `/api/oneroster/schoolenrollments?studentId=${encodeURIComponent(studentId)}&schoolYear=${encodeURIComponent(year)}` : null
  );

  if (isLoading) {
    return (
      <div className={clsx('space-y-6', locale === 'ar' && 'direction-rtl')}>
        <Card className="border border-gray-200">
          <CardHeader className="bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-80 col-span-1 md:col-span-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{t.child?.error_loading_child_data || (locale === 'ar' ? 'حدث خطأ أثناء تحميل البيانات.' : 'Error loading data.')}</div>;
  }

  if (!data || data.error) {
    return <div className="text-center py-8 text-gray-600">{locale === 'ar' ? 'لا توجد بيانات تسجيل للمدرسة.' : 'No school enrollment data available.'}</div>;
  }

  const org = data.schoolInfo ?? undefined;

  return (
    <div className={clsx('space-y-6', locale === 'ar' && 'direction-rtl')}>
      <Card className="border border-gray-200">
        <CardHeader className="bg-indigo-50 border-b border-indigo-100">
          <CardTitle className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l-8 4 8 4 8-4-8-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 14l8 4 8-4" />
              </svg>
            </div>
            <span className="text-gray-900">{locale === 'ar' ? 'معلومات المدرسة' : 'School Information'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {org ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">{locale === 'ar' ? 'اسم المدرسة' : 'School Name'}</div>
                <div className="text-gray-900 font-semibold">{org.name || org.metadata?.englishName || org.metadata?.shortName || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{locale === 'ar' ? 'معرف المدرسة' : 'School ID'}</div>
                <div className="text-gray-900 font-mono">{org.sourcedId}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500 mb-1">{locale === 'ar' ? 'العنوان' : 'Address'}</div>
                <div className="text-gray-900">{formatAddress(org.metadata?.addresses) || '—'}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">{locale === 'ar' ? 'لا تتوفر معلومات المدرسة.' : 'No school information available.'}</div>
          )}
        </CardContent>
      </Card>

    
    </div>
  );
}
