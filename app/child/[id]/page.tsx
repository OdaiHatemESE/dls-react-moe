'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import clsx from 'clsx';
import Link from 'next/link';

import { useI18n } from '@/app/i18n/I18nProvider';
import { jsonFetcher } from '@/lib/swr';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import RefreshBar, { type CacheMeta } from '@/components/RefreshBar';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import SchoolInfo from './SchoolInfo';
import StreamGrades from './StreamGrades';
import SignConductSection from './components/SignConductSection';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import InfoTab from './components/InfoTab';

type StudentProfileWithMeta = StudentProfileV1 & { meta?: { cache?: CacheMeta } };

type ActiveAcademicYearResponse = {
  id?: number;
  academicYear?: string;
  yearValue: number;
  isActive?: boolean;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDefault: boolean;
  message?: string;
  error?: string;
};

export default function ChildDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const sourcedId = params.id as string;
  const { data: session } = useSession();
  const eid = session?.user?.emiratesId as string | undefined;

  // Fetch student data from PP API
  const swrKey = sourcedId ? `/api/PP/student/${encodeURIComponent(sourcedId)}` : null;
  const swrKeySync = eid ? `/api/PP/child/sync?emirateId=${encodeURIComponent(eid)}` : null;
  const { data: student, error, isLoading, mutate } = useSWR<StudentProfileV1>(swrKey, jsonFetcher);
  
  // Fetch active academic year from admin config
  const { data: activeYearData } = useSWR<ActiveAcademicYearResponse>('/api/admin/academic-year/active', jsonFetcher);
  const activeAcademicYear = activeYearData?.yearValue ? String(activeYearData.yearValue) : String(new Date().getFullYear());
  
  const [year, setYear] = React.useState<string>(activeAcademicYear);
  
  // Update year when active academic year loads
  React.useEffect(() => {
    if (activeYearData?.yearValue) {
      setYear(String(activeYearData.yearValue));
    }
  }, [activeYearData]);
  
  // Extract meta information for RefreshBar without introducing any casts
  const meta = (student as StudentProfileWithMeta | null)?.meta;
  
  // Transform function to update the student cache with synced data
  const handleSyncData = (syncResponse: any) => {
    if (syncResponse?.students && Array.isArray(syncResponse.students)) {
      // Find the current student in the synced data
      const syncedStudent = syncResponse.students.find((s: StudentProfileV1) => s.id === sourcedId);
      if (syncedStudent) {
        // Update the student cache with the synced data
        mutate(syncedStudent, false);
      }
    }
    return syncResponse;
  };

  if (isLoading) {
    return <LoadingSkeleton locale={locale} />;
  }
  if (error) {
    const errorMessage = error?.message || String(error);
    return (
      <div className="text-center py-10">
        <div className="mb-4 text-destructive bg-destructive/10 border border-destructive/20 rounded p-4">
          {errorMessage}
        </div>
      </div>
    );
  }
  if (!student) {
    return <div className="text-center py-10">{t.child.no_data_available_for_child}</div>;
  }

  const displayName = locale === 'ar'
    ? [student.firstNameArabic, student.middleNameArabic, student.lastNameArabic].filter(Boolean).join(' ')
    : [student.firstNameEnglish, student.middleNameEnglish, student.thirdNameEnglish, student.fourthNameEnglish, student.familyNameEnglish].filter(Boolean).join(' ');

  return (
    <div className={clsx("min-h-screen bg-gradient-to-br from-background/50 via-background to-background/50", locale === 'ar' && 'direction-rtl')}>
      {/* Mobile App-like Header Section */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Mobile-First Navigation Bar */}
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Mobile-Optimized Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1 rtl:space-x-reverse" aria-label="Breadcrumb">
              <Link 
                href="/dashboard" 
                className={clsx(
                  "group inline-flex items-center px-2 py-2 md:px-3 md:py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:bg-muted/90",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted",
                  "touch-manipulation select-none"
                )}
              >
                <svg className={clsx(
                  "w-4 h-4 me-1 md:me-2 transition-all duration-200 group-hover:scale-110 group-active:scale-95",
                  locale === 'ar' && 'rotate-180'
                )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-semibold text-xs">{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
              </Link>
              
              <svg className="w-3 h-3 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
              
              <div className="flex items-center px-2 py-2 md:px-3">
                <svg className="w-3 h-3 me-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-semibold text-foreground">
                  {locale === 'ar' ? 'ملف الطالب' : 'Student'}
                </span>
              </div>
            </nav>

            {/* Mobile-Optimized Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2 min-w-0 overflow-hidden">
              <RefreshBar
                swrKey={swrKeySync}
                meta={meta}
                variant="compact"
                className="flex-shrink-0 min-w-0"
                onAfterFetch={handleSyncData}
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">

        {/* Mobile App-like Student Profile Header */}
        <div className="relative mb-6 md:mb-8 space-y-4">
          {/* Main Profile Card - Enhanced for Mobile */}
          <Card className="border-0 shadow-lg bg-card overflow-hidden touch-manipulation">
            <div className="relative px-4 py-6 md:px-8 md:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                {/* Enhanced Avatar - Mobile Optimized */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ring-2 md:ring-4 ring-background">
                    <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Status Indicator - Mobile Optimized */}
                  {student.status === 'active' && (
                    <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-2 md:border-3 border-background flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Student Information - Mobile Optimized */}
                <div className={clsx("flex-1 min-w-0", locale === 'ar' && 'text-right')}>
                  <div className="mb-2 md:mb-3">
                    <h1 className={clsx(
                      "text-lg md:text-xl font-bold text-foreground mb-1",
                      locale === 'ar' ? 'leading-relaxed' : 'leading-tight'
                    )}>
                      {displayName}
                    </h1>
                    <p className="text-muted-foreground font-medium text-xs md:text-sm">
                      {t.child.child_profile}
                    </p>
                  </div>
                  
                  {/* Enhanced Badges - Mobile Optimized */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                    <Badge variant="secondary" className="px-2 py-1 bg-muted text-muted-foreground border-border font-medium text-xs">
                      <svg className="w-2 h-2 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 00-2-2v0a2 2 0 00-2 2v2m4 0a2 2 0 104 0m-4 0a2 2 0 014 0z" />
                      </svg>
                      <span className="hidden md:inline">ID: </span>{student.studentNumber || student.id.slice(-6)}
                    </Badge>
                    
                    <Badge variant="outline" className="px-2 py-1 border-primary/20 text-primary bg-primary/10 font-medium text-xs">
                      <svg className="w-2 h-2 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {student.role || (locale === 'ar' ? 'طالب' : 'Student')}
                    </Badge>

                    {student.isActive !== undefined && (
                      <Badge 
                        variant={student.isActive ? "default" : "secondary"}
                        className={clsx(
                          "px-2.5 py-1 font-semibold text-xs",
                          student.isActive 
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" 
                            : "bg-slate-500/15 text-slate-600 border-slate-400/30"
                        )}
                      >
                        <svg className="w-3 h-3 me-1" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="4" />
                        </svg>
                        {student.isActive 
                          ? (locale === 'ar' ? 'نشط' : 'Active')
                          : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Parent Actions Banner - Full Width, Simple & Direct */}
          <Card className={clsx(
            "border-0 shadow-lg overflow-hidden touch-manipulation",
            "bg-gradient-to-r from-primary via-primary/95 to-primary/90",
            student.isActive && "hover:shadow-xl transition-all duration-300"
          )}>
            <div className="relative px-4 py-4 md:px-8 md:py-5">
              {student.isActive ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                        {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                      </h3>
                      <p className="text-xs md:text-sm text-white/90 mt-0.5">
                        {locale === 'ar' ? 'طباعة وتوقيع الوثائق المطلوبة' : 'Print & sign required documents'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <SignConductSection 
                      locale={locale} 
                      studentId={student.id}
                      studentNumber={student.studentNumber}
                      academicYear={activeAcademicYear}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs md:text-sm font-medium">
                    {locale === 'ar' 
                      ? 'الإجراءات متاحة فقط للطلاب ذوي التسجيل النشط' 
                      : 'Actions available only for students with active enrollment'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>


        {/* Student Information Section */}
        <Tabs defaultValue="info" className={clsx("w-full", locale === 'ar' && 'direction-rtl')}>

          {/* Student Information */}
          <TabsContent value="info" className={clsx("animate-in fade-in-50 duration-300", locale === 'ar' && 'direction-rtl')}>
            <div className="bg-card rounded-xl shadow-sm border border-border/80 overflow-hidden touch-manipulation">
              <InfoTab person={student} t={t} locale={locale} />
            </div>
          </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
