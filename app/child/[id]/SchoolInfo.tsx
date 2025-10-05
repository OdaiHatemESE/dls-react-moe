'use client';

import React from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/app/i18n/I18nProvider';
import type { Org, SchoolEnrollment } from '@/types';
import clsx from 'clsx';
import RefreshBar from '@/components/RefreshBar';

type ApiResponse = {
  enrollments: SchoolEnrollment[];
  count: number;
  studentId: string;
  schoolYear: string;
  schoolID?: string | null;
  // The API may return any of these shapes:
  // - schoolInfo: Org
  // - schoolInfo: { Org: Org }
  // - schoolInfo: Array<{ Org: Org }>
  // - schoolInfos: Org[]
  // - schoolInfos: Array<{ Org: Org }>
  // - schoolInfos: Array<Array<{ Org: Org }>>
  schoolInfo?: Org | { Org: Org } | Array<{ Org: Org }> | null;
  schoolIDs?: string[];     // all school ids when multiple
  schoolInfos?: Org[] | Array<{ Org: Org }> | Array<Array<{ Org: Org }>> | null;
  error?: string;
  meta?: { cache?: { source?: 'cache' | 'upstream'; lastUpdated?: string | null } };
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
  const swrKey = (() => {
    if (!studentId) return null;
    const base = `/api/oneroster/schoolenrollments?studentId=${encodeURIComponent(studentId)}`;
    if (!year || year === 'all') return base;
    return `${base}&schoolYear=${encodeURIComponent(year)}`;
  })();
  const { data, error, isLoading } = useSWR<ApiResponse>(swrKey);

  // --- helpers to normalize various response shapes into Org / Org[] ---
  function isOrg(obj: any): obj is Org {
    return !!obj && typeof obj === 'object' && ('sourcedId' in obj || 'metadata' in obj || 'name' in obj);
  }

  function extractOrgFromWrapper(item: any): Org | null {
    if (!item) return null;
    if (isOrg(item)) return item;
    if (item.Org && isOrg(item.Org)) return item.Org;
    return null;
  }

  function normalizeSingleOrg(input: ApiResponse['schoolInfo']): Org | undefined {
    if (!input) return undefined;
    // Direct Org
    if (isOrg(input)) return input;
    // { Org: Org }
    const fromWrapper = extractOrgFromWrapper(input as any);
    if (fromWrapper) return fromWrapper;
    // Array<{ Org: Org }>
    if (Array.isArray(input) && input.length) {
      const first = extractOrgFromWrapper(input[0]);
      if (first) return first;
    }
    return undefined;
  }

  function normalizeManyOrgs(input: ApiResponse['schoolInfos']): Org[] {
    if (!input) return [];
    const collect: Org[] = [];
    const pushIf = (o: Org | null) => { if (o) collect.push(o); };
    if (Array.isArray(input)) {
      // Flatten arbitrarily nested arrays and unwrap
      const flat = (input as any[]).flat ? (input as any[]).flat(Infinity) : (input as any[]);
      for (const item of flat) {
        pushIf(extractOrgFromWrapper(item));
      }
    } else {
      // Single Org-like structure
      const one = extractOrgFromWrapper(input);
      if (one) collect.push(one);
    }
    // Dedupe by sourcedId
    const seen = new Set<string>();
    return collect.filter((o) => {
      const key = o.sourcedId ?? JSON.stringify(o);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (isLoading) {
    return (
      <div className={clsx('space-y-6', locale === 'ar' && 'direction-rtl')}>
        {/* Freshness bar placeholder for skeleton state */}
        <div className="flex items-center justify-between gap-3 rounded-md border p-3 bg-card">
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="h-8 w-28 bg-muted rounded" />
        </div>
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

  const isAllYears = !year || year === 'all';
  const org = !isAllYears ? normalizeSingleOrg(data.schoolInfo) : undefined;
  const orgs = isAllYears ? normalizeManyOrgs(data.schoolInfos) : (org ? [org] : []);
  console.log('Rendering SchoolInfo with orgs:', orgs);
  return (
    <div className={clsx('space-y-6', locale === 'ar' && 'direction-rtl')}>
      {/* Freshness bar - Mobile Optimized */}
      <div className="overflow-hidden">
        <RefreshBar
          swrKey={swrKey}
          meta={data.meta}
          variant="compact"
          className="min-w-0"
          labels={{
            lastUpdated: locale === 'ar' ? 'آخر تحديث:' : 'Last updated:',
            confirm: locale === 'ar' ? 'جلب بيانات حديثة؟' : 'Fetch fresh data?',
            refresh: locale === 'ar' ? 'تحديث' : 'Refresh',
            refreshing: locale === 'ar' ? 'جاري التحديث…' : 'Refreshing…',
            unknown: locale === 'ar' ? 'غير معروف' : 'unknown',
          }}
        />
      </div>
      {/* If year is 'all' (or empty), render the list of all schools; otherwise render single school */}
      <Card className="border border-gray-200">
        <CardHeader className="bg-indigo-50 border-b border-indigo-100">
          <CardTitle className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l-8 4 8 4 8-4-8-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 14l8 4 8-4" />
              </svg>
            </div>
            <span className="text-gray-900">
              {isAllYears
                ? (locale === 'ar' ? 'معلومات المدارس' : 'Schools Information')
                : (locale === 'ar' ? 'معلومات المدرسة' : 'School Information')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isAllYears ? (
            orgs.length > 0 ? (
              <div className="space-y-4">
                {orgs.map((o, i) => (
                    
                  <div key={`${o.sourcedId ?? 'org'}-${i}`} className="p-4 border rounded-lg">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">{locale === 'ar' ? 'اسم المدرسة' : 'School Name'}</div>
                        <div className="text-gray-900 font-semibold">{o.name || o.metadata?.englishName || o.metadata?.shortName || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">{locale === 'ar' ? 'معرف المدرسة' : 'School ID'}</div>
                        <div className="text-gray-900 font-mono">{o.sourcedId}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-500 mb-1">{locale === 'ar' ? 'العنوان' : 'Address'}</div>
                        <div className="text-gray-900">{formatAddress(o.metadata?.addresses) || '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">{locale === 'ar' ? 'لا تتوفر معلومات المدارس.' : 'No schools information available.'}</div>
            )
          ) : (
            org ? (
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
            )
          )}
        </CardContent>
      </Card>

    
    </div>
  );
}
