'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import Link from 'next/link';

import { useI18n } from '@/app/i18n/I18nProvider';
import { jsonFetcher } from '@/lib/swr';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
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

export default function ChildDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const sourcedId = params.id as string;

  // Fetch student data from PP API
  const swrKey = sourcedId ? `/api/PP/student/${encodeURIComponent(sourcedId)}` : null;
  const { data: student, error, isLoading } = useSWR<StudentProfileV1>(swrKey, jsonFetcher);
  const [year, setYear] = React.useState<string>(() => String(new Date().getFullYear()));
  
  // Extract meta information for RefreshBar
  const meta = (student as any)?.meta;

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
                swrKey={swrKey}
                meta={meta}
                variant="compact"
                className="flex-shrink-0 min-w-0"
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
        <div className="relative mb-6 md:mb-8">
          {/* Main Profile Card - Enhanced for Mobile */}
          <Card className="border-0 shadow-lg bg-card overflow-hidden touch-manipulation">
            {/* Background Pattern - Optimized for mobile */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16 md:-translate-y-32 md:translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-gradient-to-tr from-primary/5 to-transparent rounded-full translate-y-12 -translate-x-12 md:translate-y-24 md:-translate-x-24"></div>
             */}
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
                      <span className="hidden md:inline">ID: </span>{student.id.slice(-6)}
                    </Badge>
                    
                    <Badge variant="outline" className="px-2 py-1 border-primary/20 text-primary bg-primary/10 font-medium text-xs">
                      <svg className="w-2 h-2 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {student.role || (locale === 'ar' ? 'طالب' : 'Student')}
                    </Badge>
                    
                    {student.status && (
                      <Badge className={clsx(
                        "px-2 py-1 font-medium text-xs",
                        student.status === 'active' 
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full me-1", 
                          student.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'
                        )}></div>
                        {student.status === 'active' ? (locale === 'ar' ? 'نشط' : 'Active') : student.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Parent Actions Section - Mobile Optimized */}
                <div className="flex-shrink-0 w-full sm:w-auto">
                  <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/80 p-3 md:p-4 shadow-sm touch-manipulation space-y-3">
                    {/* Edit Profile Button */}
                    <Link 
                      href={`/child/${student.id}/edit`}
                      className={clsx(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                        "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 touch-manipulation shadow-sm"
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{locale === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
                    </Link>

                    {/* Documents Section */}
                    <div>
                      <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-foreground">
                            {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                          </h3>
                          <p className="text-xs text-muted-foreground hidden md:block">
                            {locale === 'ar' ? 'طباعة وتوقيع الوثائق' : 'Print & sign documents'}
                          </p>
                        </div>
                      </div>
                      <SignConductSection locale={locale} studentId={student.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>


        {/* Mobile App-like Navigation Tabs */}
        <Tabs defaultValue="info" className={clsx("w-full", locale === 'ar' && 'direction-rtl')}>
          <div className="bg-card rounded-xl shadow-sm border border-border/80 p-1.5 md:p-2 mb-6 md:mb-8 sticky top-20 z-10 backdrop-blur-md">
            <TabsList className="grid w-full grid-cols-5 gap-0.5 md:gap-1 bg-transparent p-0">
              <TabsTrigger 
                value="info" 
                className={clsx(
                  "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-2 md:px-4 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:scale-105",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 touch-manipulation"
                )}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold whitespace-nowrap text-xs">{locale === 'ar' ? 'معلومات' : 'Info'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="grades"
                className={clsx(
                  "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-2 md:px-4 md:py-3 rounded-lg text-xs font-medium transition-all duration-200",
                  "data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary-foreground data-[state=active]:shadow-sm data-[state=active]:scale-105",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-secondary/20 touch-manipulation"
                )}
              >
                <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="font-semibold whitespace-nowrap text-xs">{locale === 'ar' ? 'درجات' : 'Grades'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="attendance"
                className={clsx(
                  "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-2 md:px-4 md:py-3 rounded-lg text-xs font-medium transition-all duration-200",
                  "data-[state=active]:bg-accent/10 data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm data-[state=active]:scale-105",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-accent/20 touch-manipulation"
                )}
              >
                <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold whitespace-nowrap text-xs">{locale === 'ar' ? 'حضور' : 'Attend'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="assignments"
                className={clsx(
                  "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-2 md:px-4 md:py-3 rounded-lg text-xs font-medium transition-all duration-200",
                  "data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:scale-105",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 touch-manipulation"
                )}
              >
                <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold whitespace-nowrap text-xs">{locale === 'ar' ? 'واجبات' : 'Tasks'}</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="school"
                className={clsx(
                  "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-2 md:px-4 md:py-3 rounded-lg text-xs font-medium transition-all duration-200",
                  "data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-sm data-[state=active]:scale-105",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-destructive/20 touch-manipulation"
                )}
              >
                <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-semibold whitespace-nowrap text-xs">{locale === 'ar' ? 'مدرسة' : 'School'}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Student Information - Mobile Optimized */}
          <TabsContent value="info" className={clsx("animate-in fade-in-50 duration-300", locale === 'ar' && 'direction-rtl')}>
            <div className="bg-card rounded-xl shadow-sm border border-border/80 overflow-hidden touch-manipulation">
              <InfoTab person={student} t={t} locale={locale} />
            </div>
          </TabsContent>

          {/* Tab 2: Academic Grades - Mobile Optimized */}
          <TabsContent value="grades" className="animate-in fade-in-50 duration-300">
            {student?.id ? (
              <div className="bg-card rounded-xl shadow-sm border border-border/80 overflow-hidden touch-manipulation">
                <div className="border-b border-border/80 bg-gradient-to-r from-secondary/10 to-secondary/5 px-4 py-3 md:px-6 md:py-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-secondary/20 rounded-lg">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        {locale === 'ar' ? 'الدرجات الأكاديمية' : 'Academic Grades'}
                      </h2>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {locale === 'ar' ? 'تقارير الأداء الأكاديمي للطالب' : 'Student academic performance reports'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <StreamGrades studentId={student.id} />
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border border-border/80 p-6 md:p-8 touch-manipulation">
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-muted rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                    {locale === 'ar' ? 'البيانات غير متوفرة' : 'Data Unavailable'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'هوية الطالب غير متوفرة' : 'Student ID not available'}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Attendance Tracking - Mobile Optimized */}
          <TabsContent value="attendance" className="animate-in fade-in-50 duration-300">
            <div className="bg-card rounded-xl shadow-sm border border-border/80 overflow-hidden touch-manipulation">
              <div className="border-b border-border/80 bg-gradient-to-r from-accent/10 to-accent/5 px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-accent/20 rounded-lg">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                      {locale === 'ar' ? 'تتبع الحضور' : 'Attendance Tracking'}
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                      {locale === 'ar' ? 'سجلات الحضور والغياب' : 'Attendance and absence records'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {locale === 'ar' ? 'قريباً' : 'Coming Soon'}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm">
                    {locale === 'ar' ? 'نعمل على إضافة ميزة تتبع الحضور والغياب مع تقارير مفصلة' : 'We\'re working on adding comprehensive attendance tracking with detailed reports'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Assignments & Tasks */}
          <TabsContent value="assignments" className="animate-in fade-in-50 duration-300">
            <div className="bg-card rounded-xl shadow-sm border border-border/80 overflow-hidden">
              <div className="border-b border-border/80 bg-gradient-to-r from-muted/50 to-muted/20 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {locale === 'ar' ? 'الواجبات والمهام' : 'Assignments & Tasks'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'ar' ? 'الواجبات المنزلية والمشاريع الدراسية' : 'Homework assignments and academic projects'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {locale === 'ar' ? 'قريباً' : 'Coming Soon'}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm">
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
              <div className="bg-card rounded-xl shadow-sm border border-border/80 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/20 rounded-lg">
                      <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {locale === 'ar' ? 'السنة الدراسية' : 'Academic Year'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'اختر السنة لعرض المعلومات المدرسية' : 'Select year to view school information'}
                      </p>
                    </div>
                  </div>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-40 bg-muted border-border hover:bg-muted/80 transition-colors">
                      <SelectValue placeholder={locale === 'ar' ? 'اختر السنة' : 'Select Year'} />
                    </SelectTrigger>
                    <SelectContent className="bg-card shadow-lg border border-border">
                      <SelectItem value="all" className="font-medium hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <SelectItem key={y} value={String(y)} className="font-mono hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
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
              {student?.id ? (
                <div className="bg-card rounded-xl shadow-sm border border-border/80 overflow-hidden">
                  <div className="border-b border-border/80 bg-gradient-to-r from-destructive/10 to-destructive/5 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-destructive/20 rounded-lg">
                        <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">
                          {locale === 'ar' ? 'معلومات المدرسة' : 'School Information'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {locale === 'ar' ? 'تفاصيل التسجيل والانتماء المدرسي' : 'Enrollment details and school affiliation'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <SchoolInfo studentId={student.id} year={year} />
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border/80 p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      {locale === 'ar' ? 'البيانات غير متوفرة' : 'Data Unavailable'}
                    </h3>
                    <p className="text-muted-foreground text-xs">{locale === 'ar' ? 'هوية الطالب غير متوفرة' : 'Student ID not available'}</p>
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
