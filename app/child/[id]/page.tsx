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
    <div className={clsx("min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50", locale === 'ar' && 'direction-rtl')}>
      {/* Professional Header Section */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Navigation Bar */}
          <div className="flex items-center justify-between py-4">
            {/* Professional Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1 rtl:space-x-reverse" aria-label="Breadcrumb">
              <Link 
                href="/dashboard" 
                className={clsx(
                  "group inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-100"
                )}
              >
                <svg className={clsx(
                  "w-4 h-4 me-2 transition-all duration-200 group-hover:scale-110",
                  locale === 'ar' && 'rotate-180'
                )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-semibold">{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
              </Link>
              
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
              
              <div className="flex items-center px-3 py-2">
                <svg className="w-4 h-4 me-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-semibold text-slate-900">
                  {locale === 'ar' ? 'ملف الطالب' : 'Student Profile'}
                </span>
              </div>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <RefreshBar
                swrKey={swrKey}
                meta={data.meta}
                className="shrink-0"
                labels={{
                  lastUpdated: locale === 'ar' ? 'آخر تحديث:' : 'Last updated:',
                  confirm: locale === 'ar' ? 'جلب بيانات حديثة؟' : 'Fetch fresh data?',
                  refresh: locale === 'ar' ? 'تحديث' : 'Refresh',
                  refreshing: locale === 'ar' ? 'جاري التحديث…' : 'Refreshing…',
                  unknown: locale === 'ar' ? 'غير معروف' : 'unknown',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Professional Student Profile Header */}
        <div className="relative mb-8">
          {/* Main Profile Card */}
          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-100/20 to-transparent rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative px-8 py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Enhanced Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white">
                    <span className="text-3xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Status Indicator */}
                  {person.status === 'active' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Student Information */}
                <div className={clsx("flex-1 min-w-0", locale === 'ar' && 'text-right')}>
                  <div className="mb-2">
                    <h1 className={clsx(
                      "text-3xl font-bold text-slate-900 mb-1",
                      locale === 'ar' ? 'leading-relaxed' : 'leading-tight'
                    )}>
                      {displayName}
                    </h1>
                    <p className="text-slate-600 font-medium">
                      {t.child.child_profile}
                    </p>
                  </div>
                  
                  {/* Enhanced Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge variant="secondary" className="px-3 py-1.5 bg-slate-100 text-slate-700 border-slate-200 font-medium">
                      <svg className="w-3 h-3 me-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 00-2-2v0a2 2 0 00-2 2v2m4 0a2 2 0 104 0m-4 0a2 2 0 014 0z" />
                      </svg>
                      ID: {person.sourcedId}
                    </Badge>
                    
                    <Badge variant="outline" className="px-3 py-1.5 border-blue-200 text-blue-700 bg-blue-50 font-medium">
                      <svg className="w-3 h-3 me-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {person.role || (locale === 'ar' ? 'طالب' : 'Student')}
                    </Badge>
                    
                    {person.status && (
                      <Badge className={clsx(
                        "px-3 py-1.5 font-medium",
                        person.status === 'active' 
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        <div className={clsx("w-2 h-2 rounded-full me-1.5", 
                          person.status === 'active' ? 'bg-green-500' : 'bg-slate-400'
                        )}></div>
                        {person.status === 'active' ? (locale === 'ar' ? 'نشط' : 'Active') : person.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Parent Actions Section */}
                <div className="flex-shrink-0">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {locale === 'ar' ? 'طباعة وتوقيع الوثائق' : 'Print & sign documents'}
                        </p>
                      </div>
                    </div>
                    <SignConductSection locale={locale} studentId={person.sourcedId} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>


        {/* Professional Navigation Tabs */}
        <Tabs defaultValue="info" className={clsx("w-full", locale === 'ar' && 'direction-rtl')}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-2 mb-8">
            <TabsList className="grid w-full grid-cols-5 gap-1 bg-transparent p-0">
              <TabsTrigger 
                value="info" 
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:block font-semibold">{locale === 'ar' ? 'معلومات' : 'Info'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="grades"
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                )}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:block font-semibold">{locale === 'ar' ? 'درجات' : 'Grades'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="attendance"
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                )}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:block font-semibold">{locale === 'ar' ? 'حضور' : 'Attend'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="assignments"
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50",
                  "focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                )}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:block font-semibold">{locale === 'ar' ? 'واجبات' : 'Tasks'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="school"
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50",
                  "focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                )}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden sm:block font-semibold">{locale === 'ar' ? 'مدرسة' : 'School'}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Student Information */}
          <TabsContent value="info" className={clsx("animate-in fade-in-50 duration-300", locale === 'ar' && 'direction-rtl')}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <InfoTab person={person} t={t} locale={locale} />
            </div>
          </TabsContent>

          {/* Tab 2: Academic Grades */}
          <TabsContent value="grades" className="animate-in fade-in-50 duration-300">
            {person?.sourcedId ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-emerald-900">
                        {locale === 'ar' ? 'الدرجات الأكاديمية' : 'Academic Grades'}
                      </h2>
                      <p className="text-sm text-emerald-700">
                        {locale === 'ar' ? 'تقارير الأداء الأكاديمي للطالب' : 'Student academic performance reports'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <StreamGrades studentId={person.sourcedId} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {locale === 'ar' ? 'البيانات غير متوفرة' : 'Data Unavailable'}
                  </h3>
                  <p className="text-slate-600">{locale === 'ar' ? 'هوية الطالب غير متوفرة' : 'Student ID not available'}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Attendance Tracking */}
          <TabsContent value="attendance" className="animate-in fade-in-50 duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="border-b border-slate-200/80 bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-violet-900">
                      {locale === 'ar' ? 'تتبع الحضور' : 'Attendance Tracking'}
                    </h2>
                    <p className="text-sm text-violet-700">
                      {locale === 'ar' ? 'سجلات الحضور والغياب' : 'Attendance and absence records'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-12">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {locale === 'ar' ? 'قريباً' : 'Coming Soon'}
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    {locale === 'ar' ? 'نعمل على إضافة ميزة تتبع الحضور والغياب مع تقارير مفصلة' : 'We\'re working on adding comprehensive attendance tracking with detailed reports'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Assignments & Tasks */}
          <TabsContent value="assignments" className="animate-in fade-in-50 duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="border-b border-slate-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-amber-900">
                      {locale === 'ar' ? 'الواجبات والمهام' : 'Assignments & Tasks'}
                    </h2>
                    <p className="text-sm text-amber-700">
                      {locale === 'ar' ? 'الواجبات المنزلية والمشاريع الدراسية' : 'Homework assignments and academic projects'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-12">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {locale === 'ar' ? 'قريباً' : 'Coming Soon'}
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    {locale === 'ar' ? 'نعمل على إضافة نظام إدارة الواجبات والمهام الدراسية' : 'We\'re developing a comprehensive assignment management system'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 5: School Information */}
          <TabsContent value="school" className="animate-in fade-in-50 duration-300">
            <div className="space-y-6">
              {/* Enhanced Year Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {locale === 'ar' ? 'السنة الدراسية' : 'Academic Year'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {locale === 'ar' ? 'اختر السنة لعرض المعلومات المدرسية' : 'Select year to view school information'}
                      </p>
                    </div>
                  </div>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-40 bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
                      <SelectValue placeholder={locale === 'ar' ? 'اختر السنة' : 'Select Year'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg border border-slate-200">
                      <SelectItem value="all" className="font-medium hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          <span>{locale === 'ar' ? 'كل السنوات' : 'All Years'}</span>
                        </div>
                      </SelectItem>
                      {(() => {
                        const current = new Date().getFullYear();
                        const years: number[] = [];
                        for (let y = current + 1; y >= 2017; y--) years.push(y);
                        return years.map((y) => (
                          <SelectItem key={y} value={String(y)} className="font-mono hover:bg-slate-50">
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="2"/>
                              </svg>
                              {String(y)}
                            </div>
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* School Information Content */}
              {person?.sourcedId ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                  <div className="border-b border-slate-200/80 bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 rounded-lg">
                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-rose-900">
                          {locale === 'ar' ? 'معلومات المدرسة' : 'School Information'}
                        </h2>
                        <p className="text-sm text-rose-700">
                          {locale === 'ar' ? 'تفاصيل التسجيل والانتماء المدرسي' : 'Enrollment details and school affiliation'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <SchoolInfo studentId={person.sourcedId} year={year} />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {locale === 'ar' ? 'البيانات غير متوفرة' : 'Data Unavailable'}
                    </h3>
                    <p className="text-slate-600">{locale === 'ar' ? 'هوية الطالب غير متوفرة' : 'Student ID not available'}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
