"use client";

import React from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
import { useI18n } from "@/app/i18n/I18nProvider";
import { jsonFetcher } from "@/lib/swr";
import type { StudentProfileV1 } from "@/app/types/studentprofile";
import type { ChildActionResponse } from "@/types/child-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChildActions, { ChildStatusBadge } from "@/app/dashboard/components/ChildActions";

type ChildWithActions = StudentProfileV1 & {
  actions?: ChildActionResponse;
};

const DEFAULT_ACADEMIC_YEAR = "2025-2026";

function parseEntryDate(value?: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function resolveLatestEnrollment(enrollments?: StudentProfileV1["enrollment"]): StudentProfileV1["enrollment"][number] | null {
  if (!enrollments || enrollments.length === 0) return null;
  const [first, ...rest] = enrollments;
  let latest = first;
  let latestTime = parseEntryDate(first.entryDate);

  for (const entry of rest) {
    const entryTime = parseEntryDate(entry.entryDate);
    if (entryTime > latestTime) {
      latest = entry;
      latestTime = entryTime;
    }
  }

  return latest;
}

function normalizeAcademicYear(value?: string | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  if (trimmed.includes("-")) return trimmed;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(parsed) && parsed > 0) {
    return `${parsed - 1}-${parsed}`;
  }
  return trimmed;
}

function deriveAcademicYear(enrollments?: StudentProfileV1["enrollment"]): string {
  const latest = resolveLatestEnrollment(enrollments);
  const normalized = normalizeAcademicYear(latest?.schoolYear);
  return normalized ?? DEFAULT_ACADEMIC_YEAR;
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count}</>;
}

export default function ParentSummaryPage() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const eid = session?.user?.emiratesId as string | undefined;
  
  const swrKey = eid ? `/api/PP/ChildList/${encodeURIComponent(eid)}` : null;
  const { data: childrenData, isLoading } = useSWR<any>(swrKey, jsonFetcher);
  const children = childrenData?.students ?? [];

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    const totalChildren = children.length;
    const activeChildren = children.filter((c: StudentProfileV1) => c.status === "active").length;
    const maleChildren = children.filter((c: StudentProfileV1) => c.gender === "Male").length;
    const femaleChildren = children.filter((c: StudentProfileV1) => c.gender === "Female").length;
    
    // Group by education type from enrollments
    const educationTypes = new Map<string, number>();
    children.forEach((child: StudentProfileV1) => {
      const eduType = child.enrollment?.[0]?.educationType || "Unknown";
      educationTypes.set(eduType, (educationTypes.get(eduType) || 0) + 1);
    });

    // Group by nationality
    const nationalities = new Map<string, number>();
    children.forEach((child: StudentProfileV1) => {
      const nat = locale === 'ar' ? child.NationalityAR : child.NationalityEN;
      if (nat) {
        nationalities.set(nat, (nationalities.get(nat) || 0) + 1);
      }
    });

    return {
      totalChildren,
      activeChildren,
      maleChildren,
      femaleChildren,
      educationTypes,
      nationalities,
    };
  }, [children, locale]);

  // Calculate average age
  const averageAge = React.useMemo(() => {
    const ages = children
      .filter((c: StudentProfileV1) => c.dateOfBirth)
      .map((c: StudentProfileV1) => {
        const birthDate = new Date(c.dateOfBirth!);
        const today = new Date();
        return today.getFullYear() - birthDate.getFullYear();
      });
    
    if (ages.length === 0) return 0;
    return Math.round(ages.reduce((sum: number, age: number) => sum + age, 0) / ages.length);
  }, [children]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
         
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'نقوم بتحضير ملخص أطفالك' : 'Preparing your children summary'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen bg-gradient-to-br from-background via-background to-primary/5", locale === 'ar' && 'direction-rtl')}>
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground overflow-hidden">
      
        
        <div className="relative container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
              <div className="relative">
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
              </div>
              <span className="font-semibold">{locale === 'ar' ? 'ملخص الأطفال' : 'Children Summary'}</span>
            </div>
            
            {/* Main Title with Gradient */}
            <h1 className={clsx(
              "text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/80 animate-fade-in",
              locale === 'ar' && 'leading-relaxed'
            )}>
              {locale === 'ar' ? 'نظرة شاملة على أطفالك' : 'Your Children at a Glance'}
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8 animate-fade-in-delay">
              {locale === 'ar' 
                ? 'احصل على رؤية واضحة لجميع المعلومات المهمة عن أطفالك في مكان واحد'
                : 'Get a clear view of all important information about your children in one place'}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-delay-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 transition-all hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
              </Link>
              <button
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary hover:bg-white/90 rounded-lg transition-all hover:scale-105 shadow-lg font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>{locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 transform rotate-180">
          <svg className="w-full h-12 sm:h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-background"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Children */}
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:blur-3xl transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                </div>
                <div className="text-5xl font-bold mb-2 group-hover:scale-105 transition-transform">
                  <AnimatedCounter value={stats.totalChildren} />
                </div>
                <div className="text-sm text-white/90 font-medium uppercase tracking-wider">
                  {locale === 'ar' ? 'إجمالي الأطفال' : 'Total Children'}
                </div>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>{locale === 'ar' ? 'كامل العائلة' : 'Full Family'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Children */}
          <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:blur-3xl transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse animation-delay-200" />
                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse animation-delay-400" />
                  </div>
                </div>
                <div className="text-5xl font-bold mb-2 group-hover:scale-105 transition-transform">
                  <AnimatedCounter value={stats.activeChildren} />
                </div>
                <div className="text-sm text-white/90 font-medium uppercase tracking-wider">
                  {locale === 'ar' ? 'الطلاب النشطون' : 'Active Students'}
                </div>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-white h-full rounded-full transition-all duration-1000"
                        style={{ width: `${stats.totalChildren > 0 ? (stats.activeChildren / stats.totalChildren * 100) : 0}%` }}
                      />
                    </div>
                    <span className="font-semibold">{stats.totalChildren > 0 ? Math.round(stats.activeChildren / stats.totalChildren * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Age */}
          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:blur-3xl transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-5xl font-bold group-hover:scale-105 transition-transform">
                    <AnimatedCounter value={averageAge} />
                  </div>
                  <span className="text-xl font-medium text-white/80">{locale === 'ar' ? 'سنة' : 'yrs'}</span>
                </div>
                <div className="text-sm text-white/90 font-medium uppercase tracking-wider">
                  {locale === 'ar' ? 'متوسط العمر' : 'Average Age'}
                </div>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{locale === 'ar' ? 'محسوب تلقائياً' : 'Auto-calculated'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gender Ratio */}
          <Card className="border-0 bg-gradient-to-br from-pink-500 to-pink-600 text-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:blur-3xl transition-all" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-blue-300 rounded-full" />
                    <div className="w-2 h-2 bg-pink-300 rounded-full" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform">
                  <AnimatedCounter value={stats.maleChildren} /> / <AnimatedCounter value={stats.femaleChildren} />
                </div>
                <div className="text-sm text-white/90 font-medium uppercase tracking-wider">
                  {locale === 'ar' ? 'ذكور / إناث' : 'Male / Female'}
                </div>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-blue-300 rounded-full" />
                      <span className="text-white/80">{stats.maleChildren} {locale === 'ar' ? 'ذكور' : 'Boys'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-pink-300 rounded-full" />
                      <span className="text-white/80">{stats.femaleChildren} {locale === 'ar' ? 'إناث' : 'Girls'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Education Types */}
          <Card className="border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
         
            <CardContent className="p-6 relative">
              <div className="space-y-4">
                {Array.from(stats.educationTypes.entries()).map(([type, count], index) => {
                  const percentage = stats.totalChildren > 0 ? (count / stats.totalChildren * 100) : 0;
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                  const bgColors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50'];
                  
                  return (
                    <div key={type} className="group/item hover:scale-102 transition-transform">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} group-hover/item:scale-150 transition-transform shadow-sm`} />
                          <span className="text-foreground font-semibold capitalize">{type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-medium">{percentage.toFixed(0)}%</span>
                          <Badge variant="secondary" className="px-3 py-1 font-bold min-w-[3rem] justify-center">
                            {count}
                          </Badge>
                        </div>
                      </div>
                      <div className={`h-2 ${bgColors[index % bgColors.length]} rounded-full overflow-hidden`}>
                        <div 
                          className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {stats.educationTypes.size === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {locale === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Nationalities */}
          <Card className="border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-secondary/10 to-transparent relative">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="block">{locale === 'ar' ? 'الجنسيات' : 'Nationalities'}</span>
                  <span className="text-xs font-normal text-muted-foreground">{locale === 'ar' ? 'التنوع الثقافي للأطفال' : 'Cultural diversity of children'}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="space-y-4">
                {Array.from(stats.nationalities.entries()).map(([nationality, count], index) => {
                  const percentage = stats.totalChildren > 0 ? (count / stats.totalChildren * 100) : 0;
                  const colors = ['bg-emerald-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500'];
                  const bgColors = ['bg-emerald-50', 'bg-cyan-50', 'bg-indigo-50', 'bg-rose-50', 'bg-amber-50'];
                  
                  return (
                    <div key={nationality} className="group/item hover:scale-102 transition-transform">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} group-hover/item:scale-150 transition-transform shadow-sm`} />
                          <span className="text-foreground font-semibold">{nationality}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-medium">{percentage.toFixed(0)}%</span>
                          <Badge variant="secondary" className="px-3 py-1 font-bold min-w-[3rem] justify-center">
                            {count}
                          </Badge>
                        </div>
                      </div>
                      <div className={`h-2 ${bgColors[index % bgColors.length]} rounded-full overflow-hidden`}>
                        <div 
                          className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {stats.nationalities.size === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {locale === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Children Cards */}
        <Card className="border-0 bg-card shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10 relative">
            <CardTitle className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="block text-xl font-bold">{locale === 'ar' ? 'قائمة الأطفال' : 'Children List'}</span>
                  <span className="block text-sm font-normal text-muted-foreground">{locale === 'ar' ? 'جميع أطفالك في مكان واحد' : 'All your children in one place'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-4 py-2 text-base font-bold border-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {stats.totalChildren} {locale === 'ar' ? 'طفل' : 'children'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child: StudentProfileV1) => {
                const displayName = locale === 'ar'
                  ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic].filter(Boolean).join(' ')
                  : [child.firstNameEnglish, child.middleNameEnglish, child.thirdNameEnglish, child.fourthNameEnglish, child.familyNameEnglish].filter(Boolean).join(' ');

                const age = child.dateOfBirth 
                  ? new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()
                  : null;

                const resolvedStudentNumber = child.studentNumber?.trim() || null;
                const resolvedAcademicYear = resolvedStudentNumber ? deriveAcademicYear(child.enrollment) : undefined;

                return (
                  <div
                    key={child.id}
                    className="group/card"
                  >
                    <Card className="border-2 border-border/50 hover:border-primary/50 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-card to-card/50 h-full flex flex-col relative overflow-hidden">
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover/card:blur-3xl transition-all" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full translate-y-12 -translate-x-12 blur-xl" />
                      
                      <CardContent className="p-6 flex-1 flex flex-col relative">
                        <Link
                          href={`/child/${child.id}`}
                          className="flex items-start gap-4 mb-5 group/link"
                        >
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0 group-hover/link:scale-110 group-hover/link:rotate-3 transition-all shadow-lg">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            {/* Online Status Indicator */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-card rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate mb-2 group-hover/link:text-primary transition-colors text-lg">
                              {displayName}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant={child.status === "active" ? "default" : "secondary"}
                                className="text-xs font-semibold shadow-sm"
                              >
                                {child.status === "active" 
                                  ? (locale === 'ar' ? 'نشط' : 'Active')
                                  : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                              </Badge>
                              <ChildStatusBadge studentPersonId={child.id} variant="mobile" />
                            </div>
                          </div>
                        </Link>
                        
                        {/* Student Details with Icons */}
                        <div className="space-y-3 text-sm mb-5 bg-muted/30 rounded-xl p-4 backdrop-blur-sm">
                          {child.studentNumber && (
                            <div className="flex items-center gap-3 text-muted-foreground group/detail hover:text-foreground transition-colors">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover/detail:scale-110 transition-transform">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-muted-foreground/70 uppercase tracking-wide mb-0.5">{locale === 'ar' ? 'رقم الطالب' : 'Student ID'}</div>
                                <div className="font-semibold text-foreground truncate">{child.studentNumber}</div>
                              </div>
                            </div>
                          )}
                          
                          {age && (
                            <div className="flex items-center gap-3 text-muted-foreground group/detail hover:text-foreground transition-colors">
                              <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center shrink-0 group-hover/detail:scale-110 transition-transform">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-muted-foreground/70 uppercase tracking-wide mb-0.5">{locale === 'ar' ? 'العمر' : 'Age'}</div>
                                <div className="font-semibold text-foreground">{age} {locale === 'ar' ? 'سنة' : 'years old'}</div>
                              </div>
                            </div>
                          )}

                          {child.enrollment?.[0]?.educationType && (
                            <div className="flex items-center gap-3 text-muted-foreground group/detail hover:text-foreground transition-colors">
                              <div className="w-8 h-8 bg-green/10 rounded-lg flex items-center justify-center shrink-0 group-hover/detail:scale-110 transition-transform">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-muted-foreground/70 uppercase tracking-wide mb-0.5">{locale === 'ar' ? 'نوع التعليم' : 'Education'}</div>
                                <div className="font-semibold text-foreground capitalize truncate">{child.enrollment[0].educationType}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Section */}
                        <div className="mt-auto space-y-3">
                          {/* Child Actions */}
                          <div className="transform transition-all group-hover/card:scale-102">
                            <ChildActions 
                              studentPersonId={child.id}
                              parentPersonId={session?.user?.emiratesId}
                              studentEmirateId={child.emirateId}
                              studentNumber={resolvedStudentNumber}
                              academicYear={resolvedAcademicYear}
                              className="w-full"
                            />
                          </div>
                          
                          {/* View Details Button */}
                          <Link
                            href={`/child/${child.id}`}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl transition-all shadow-md hover:shadow-xl font-semibold group/btn transform hover:scale-105"
                          >
                            <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{locale === 'ar' ? 'عرض التفاصيل الكاملة' : 'View Full Profile'}</span>
                            <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                            </svg>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {children.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {locale === 'ar' ? 'لا توجد بيانات' : 'No Children Found'}
                </h3>
                <p className="text-muted-foreground">
                  {locale === 'ar' 
                    ? 'لم يتم العثور على أطفال مرتبطين بحسابك'
                    : 'No children linked to your account'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
