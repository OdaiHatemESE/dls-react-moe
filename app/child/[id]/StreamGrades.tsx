'use client';

import React from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/app/i18n/I18nProvider';
import type { Org, SchoolEnrollment, StreamGrade } from '@/types';
import clsx from 'clsx';

type ApiResponse = {
  enrollments: SchoolEnrollment[];
  count: number;
  studentId: string;
  schoolYear: string;
  // Some vendors return nested arrays like [[{ streamGrade: {...} }]]
  // Allow any here and normalize at runtime
  StreamGrades?: any[];
  // School info may come as a single or multiple orgs, possibly wrapped
  schoolInfo?: any;
  schoolInfos?: any;
  error?: string;
};

export default function StreamGrades({ studentId }: { studentId: string }) {
  const { locale } = useI18n();
  const { data, error, isLoading } = useSWR<ApiResponse>(() =>
    studentId ? `/api/oneroster/schoolenrollments?studentId=${encodeURIComponent(studentId)}` : null
  );

  // Helper to extract a single streamGrade object from various shapes
  const extractStreamGrade = (raw: any): StreamGrade['streamGrade'] | undefined => {
    if (!raw) return undefined;
    let x = raw;
    // Unwrap nested arrays by taking the first element repeatedly
    while (Array.isArray(x) && x.length > 0) x = x[0];
    if (!x) return undefined;
    // If wrapper has streamGrade key
    if (x && typeof x === 'object' && 'streamGrade' in x && x.streamGrade) {
      return (x as StreamGrade).streamGrade;
    }
    // Some responses may already be the inner streamGrade object
    if (x && typeof x === 'object' && ('name' in x || 'title' in x)) {
      // best-effort shape acceptance
      return x as unknown as StreamGrade['streamGrade'];
    }
    return undefined;
  };

  // --- helpers to normalize various response shapes for Org(s) ---
  const isOrg = (obj: any): obj is Org => !!obj && typeof obj === 'object' && ('sourcedId' in obj || 'metadata' in obj || 'name' in obj);
  const extractOrgFromWrapper = (item: any): Org | null => {
    if (!item) return null;
    if (isOrg(item)) return item;
    if (item.Org && isOrg(item.Org)) return item.Org as Org;
    return null;
  };
  const normalizeManyOrgs = (input: ApiResponse['schoolInfos']): Org[] => {
    if (!input) return [];
    const collect: Org[] = [];
    const pushIf = (o: Org | null) => { if (o) collect.push(o); };
    if (Array.isArray(input)) {
      const flat = (input as any[]).flat ? (input as any[]).flat(Infinity) : (input as any[]);
      for (const item of flat) pushIf(extractOrgFromWrapper(item));
    } else {
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
  };

  // Build row list by pairing enrollments with stream grades (API keeps order aligned)
  const rows = React.useMemo(() => {
    if (!data?.enrollments || !data.StreamGrades) return [] as Array<{
      year: number;
      enrollmentId: string;
      sg?: StreamGrade['streamGrade'];
      status?: string;
      schoolId?: string;
    }>;

    const list: Array<{ year: number; enrollmentId: string; sg?: StreamGrade['streamGrade']; status?: string; schoolId?: string }> = [];
    const seen = new Set<string>(); // key: `${year}:${sgId}`

    for (let i = 0; i < data.enrollments.length; i++) {
      const en = data.enrollments[i]!;
      const raw = data.StreamGrades[i];
      const sg = extractStreamGrade(raw);
      const sgId = sg?.sourcedId || en.streamGrade?.sourcedId;

      // Deduplicate by year + streamGrade sourcedId when available
      if (sgId) {
        const key = `${en.schoolYear}:${sgId}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }

      list.push({
        year: en.schoolYear,
        enrollmentId: en.sourcedId,
        sg,
        status: sg?.status,
        schoolId: en.school?.sourcedId,
      });
    }

    // Sort by year only (descending)
    list.sort((a, b) => b.year - a.year);

    return list;
  }, [data]);

  if (isLoading) {
    return (
      <Card className={clsx('border border-gray-200', locale === 'ar' && 'direction-rtl')}>
        <CardHeader className="bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {locale === 'ar' ? 'حدث خطأ أثناء تحميل الدرجات.' : 'Error loading stream grades.'}
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-8 text-gray-600">
        {locale === 'ar' ? 'لا تتوفر بيانات الدرجات.' : 'No stream grades available.'}
      </div>
    );
  }

  // If API did not provide the expanded StreamGrades, we can still show sourcedIds from enrollments
  const hasExpanded = Array.isArray(data.StreamGrades)
    && rows.some((r) => !!r.sg);

  return (
    <Card className={clsx('border border-gray-200', locale === 'ar' && 'direction-rtl')}>
      <CardHeader className="bg-yellow-50 border-b border-yellow-100">
        <CardTitle className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg mr-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.083 12.083 0 015.84 10.578L12 14z" />
            </svg>
          </div>
          <span className="text-gray-900">{locale === 'ar' ? 'المراحل الدراسية' : 'Stream Grades'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="p-6 text-gray-600">
            {locale === 'ar' ? 'لا توجد مراحل دراسية لعرضها.' : 'No stream grades to display.'}
          </div>
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-gray-500 bg-gray-50">
              <div className="col-span-1">{locale === 'ar' ? 'السنة' : 'Year'}</div>
              <div className="col-span-5 text-center">{locale === 'ar' ? 'المرحلة/المسمى' : 'Grade / Title'}</div>
              <div className="col-span-6 text-center">{locale === 'ar' ? 'المدرسة' : 'School'}</div>
            </div>
            {(() => {
              // Build org map once per render for quick lookup
              const orgs = normalizeManyOrgs(data.schoolInfos ?? (data.schoolInfo ? [data.schoolInfo] : undefined));
              const orgById = new Map<string, Org>();
              for (const o of orgs) {
                if (o?.sourcedId) orgById.set(o.sourcedId, o);
              }
              return rows.map((r) => {
                const namePrimary = locale === 'ar' ? r.sg?.metadata?.titleArabic || r.sg?.title || r.sg?.name : r.sg?.title || r.sg?.name || r.sg?.metadata?.titleArabic;
                const nameSecondary = locale === 'ar' ? (r.sg?.title || r.sg?.name) : r.sg?.metadata?.titleArabic;
                const org = r.schoolId ? orgById.get(r.schoolId) : undefined;
                const schoolName = org?.name || org?.metadata?.englishName || org?.metadata?.shortName || '—';
                return (
                  <div key={`${r.enrollmentId}`} className="grid grid-cols-12 px-6 py-4 items-center">
                    <div className="col-span-1 font-mono text-sm">{r.year}</div>
                    <div className="col-span-5 text-center">
                      <div className="text-gray-900 font-medium">{namePrimary || '—'}</div>
                      {nameSecondary && (
                        <div className="text-gray-500 text-xs mt-0.5">{nameSecondary}</div>
                      )}
                    </div>
                    <div className="col-span-6 truncate text-gray-700 text-center">{schoolName}</div>
                    
                  </div>
                );
              });
            })()}
          </div>
        )}
        {!hasExpanded && rows.length > 0 && (
          <div className="px-6 py-3 text-xs text-gray-500 bg-amber-50 border-t">
            {locale === 'ar'
              ? 'ملاحظة: تم عرض معرف المراحل فقط لأن تفاصيل المرحلة غير متوفرة.'
              : 'Note: Only enrollment and year are shown because stream grade details were not expanded.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
