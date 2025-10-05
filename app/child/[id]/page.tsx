'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import clsx from 'clsx';
import Link from 'next/link';

import { useI18n } from '@/app/i18n/I18nProvider';
import { jsonFetcher } from '@/lib/swr';
import { Person } from '@/types';
import RefreshBar from '@/components/RefreshBar';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import SchoolInfo from './SchoolInfo';
import StreamGrades from './StreamGrades';
import SignConductSection from './components/SignConductSection';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import InfoTab from './components/InfoTab';

interface BasicInfoResponse {
  meta: {
    eid: string;
    personSourcedId: string;
    role: string;
    studentCount: number;
    cache?: { source?: 'cache' | 'upstream'; lastUpdated?: string | null };
  };
  parent: Person[];
  children: Person[];
}

export default function ChildDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const sourcedId = params.id as string;

  // Only send sourcedId, do not send eid (parent EID is taken from session on backend)
  const swrKey = sourcedId ? `/api/oneroster/basic-info-full?sourcedId=${encodeURIComponent(sourcedId)}` : null;
  const { data, error, isLoading } = useSWR<BasicInfoResponse>(swrKey, jsonFetcher);
  const [year, setYear] = React.useState<string>(() => String(new Date().getFullYear()));

  if (isLoading) {
    return <LoadingSkeleton locale={locale} />;
  }
  if (error) {
    // If the error object contains a warning from the API, show it
    if (error.warning) {
      return (
        <div className="text-center py-10">
          <div className="mb-4 text-amber-800 bg-amber-50 border border-amber-200 rounded p-4">
            {error.warning}
          </div>
        </div>
      );
    }
    return <div className="text-center py-10 text-aered-600">{t.child.error_loading_child_data}</div>;
  }
  if (data && (data as any).warning) {
    return (
      <div className="text-center py-10">
        <div className="mb-4 text-amber-800 bg-amber-50 border border-amber-200 rounded p-4">
          {(data as any).warning}
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="text-center py-10">{t.child.no_data_available_for_child}</div>;
  }

  const person = data.parent?.[0] || data.children?.[0];
  if (!person) {
    return <div className="text-center py-10">{t.child.child_not_found}</div>;
  }

  const displayName = locale === 'ar'
    ? [person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ')
    : [person.metadata?.englishFirstName, person.metadata?.englishSecondName, person.metadata?.englishThirdName, person.metadata?.englishFamilyName].filter(Boolean).join(' ');

  return (
    <div className={clsx("min-h-screen", locale === 'ar' && 'direction-rtl')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data freshness bar (basic-info-full) */}
        <RefreshBar
          swrKey={swrKey}
          meta={data.meta}
          className="mb-4"
          labels={{
            lastUpdated: locale === 'ar' ? 'آخر تحديث:' : 'Last updated:',
             confirm: locale === 'ar' ? 'جلب بيانات حديثة؟' : 'Fetch fresh data?',
            refresh: locale === 'ar' ? 'تحديث' : 'Refresh',
            refreshing: locale === 'ar' ? 'جاري التحديث…' : 'Refreshing…',
            unknown: locale === 'ar' ? 'غير معروف' : 'unknown',
          }}
        />
        {/* Enhanced Back Navigation with Breadcrumbs */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Link 
              href="/dashboard" 
              className={`inline-flex items-center ${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} text-muted-foreground hover:text-primary transition-all duration-200 hover:bg-primary/10 px-3 py-2 rounded-lg group`}
            >
              <svg className={clsx("w-4 h-4 me-2 group-hover:scale-110 transition-transform", 
                locale === 'ar' && 'rotate-180'
              )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4M16 5v4" />
              </svg>
              {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
            <span className={`${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} text-foreground`}>
              {locale === 'ar' ? 'ملف الطالب' : 'Student Profile'}
            </span>
          </div>
        </nav>

        {/* Compact Parent Actions */}
        <div className="mb-4">
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <div className={clsx("flex items-center justify-between", locale === 'ar' && 'direction-rtl')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`${locale === 'ar' ? 'text-sm font-medium' : 'text-base font-semibold'} text-card-foreground`}>
                    {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'طباعة وتوقيع الوثائق' : 'Print & sign documents'}
                  </p>
                </div>
              </div>
              <SignConductSection locale={locale} studentId={person.sourcedId} />
            </div>
          </div>
        </div>

        {/* Minimized Student Header */}
        <Card className="mb-6 border-0 shadow-sm bg-card overflow-hidden">
          <div className="relative bg-gradient-to-r from-primary/5 via-background to-primary/5 px-6 py-6">
            <div className="flex items-center gap-4">
              {/* Compact Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <span className="text-2xl font-bold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Student Info */}
              <div className={clsx("flex-1 min-w-0", locale === 'ar' && 'text-right')}>
                <h1 className={`${locale === 'ar' ? 'text-xl font-semibold' : 'text-2xl font-bold'} text-foreground mb-1 truncate`}>
                  {displayName}
                </h1>
                <p className={`text-muted-foreground ${locale === 'ar' ? 'text-sm' : 'text-sm'} mb-3`}>
                  {t.child.child_profile}
                </p>
                
                {/* Compact Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    ID: {person.sourcedId}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {person.role || (locale === 'ar' ? 'طالب' : 'Student')}
                  </Badge>
                  {person.status && (
                    <Badge 
                      variant={person.status === 'active' ? 'default' : 'secondary'} 
                      className={clsx(
                        "text-xs px-2 py-1",
                        person.status === 'active' 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <div className={clsx("w-1.5 h-1.5 rounded-full me-1", 
                        person.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/50'
                      )}></div>
                      {person.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>


        {/* Streamlined Navigation Tabs */}
        <Tabs defaultValue="info" className={clsx("w-full", locale === 'ar' && 'direction-rtl')}>
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 rounded-lg p-1 mb-6">
            <TabsTrigger 
              value="info" 
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">{locale === 'ar' ? 'معلومات' : 'Info'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="grades"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">{locale === 'ar' ? 'درجات' : 'Grades'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attendance"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">{locale === 'ar' ? 'حضور' : 'Attend'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assignments"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">{locale === 'ar' ? 'واجبات' : 'Tasks'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="school"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="hidden sm:inline">{locale === 'ar' ? 'مدرسة' : 'School'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Info */}
          <TabsContent value="info" className={clsx("animate-in fade-in-50 duration-300", locale === 'ar' && 'direction-rtl')}>
            <InfoTab person={person} t={t} locale={locale} />
          </TabsContent>

          {/* Tab 2: Grades */}
          <TabsContent value="grades" className="animate-in fade-in-50 duration-300">
            {person?.sourcedId ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <StreamGrades studentId={person.sourcedId} />
                </div>
              </div>
            ) : (
              <Card className="p-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'هوية الطالب غير متوفرة' : 'Student ID not available'}</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Attendance */}
          <TabsContent value="attendance" className="animate-in fade-in-50 duration-300">
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {locale === 'ar' ? 'قريبًا' : 'Coming Soon'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'معلومات الحضور والغياب' : 'Attendance tracking reports'}
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 4: Assignments */}
          <TabsContent value="assignments" className="animate-in fade-in-50 duration-300">
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {locale === 'ar' ? 'قريبًا' : 'Coming Soon'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'الواجبات والمهام الدراسية' : 'Assignments and homework'}
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 5: School Info */}
          <TabsContent value="school" className="animate-in fade-in-50 duration-300">
            <div className="space-y-4">
              {/* Compact Year Selector */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-foreground">
                      {locale === 'ar' ? 'السنة الدراسية' : 'Academic Year'}
                    </span>
                  </div>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-32 bg-background border-border">
                      <SelectValue placeholder={locale === 'ar' ? 'اختر' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-medium">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          {locale === 'ar' ? 'كل السنوات' : 'All years'}
                        </div>
                      </SelectItem>
                      {(() => {
                        const current = new Date().getFullYear();
                        const years: number[] = [];
                        for (let y = current + 1; y >= 2017; y--) years.push(y);
                        return years.map((y) => (
                          <SelectItem key={y} value={String(y)} className="font-mono">
                            {String(y)}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* School Information Content */}
              {person?.sourcedId ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <SchoolInfo studentId={person.sourcedId} year={year} />
                </div>
              ) : (
                <Card className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'هوية الطالب غير متوفرة' : 'Student ID not available'}</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
