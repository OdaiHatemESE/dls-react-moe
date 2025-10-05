"use client";

import React from "react";
import { useChildren } from "@/lib/hooks/useChildren";
import type { Person } from "@/types";
import Link from "next/link";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRightIcon,
} from "@/app/components/icons";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import clsx from "clsx";

// Helper function to calculate age from birth date
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;

  try {
    const today = new Date();
    const birth = new Date(birthDate);

    // Check if birth date is valid
    if (isNaN(birth.getTime()) || birth > today) {
      return 0;
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // Return 0 for negative ages (shouldn't happen with valid data)
    return Math.max(0, age);
  } catch {
    return 0;
  }
};


// Helper function to format date based on locale
const formatDate = (dateString: string, locale: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
};

// Enhanced helper components for clean UI with theme-aware colors
const InfoItem = ({ label, value, icon, locale }: { label: string; value: string; icon?: React.ReactNode; locale?: string }) => (
  <div className={`flex items-center justify-between py-3 px-4 bg-muted/80 backdrop-blur-sm rounded-xl border border-border hover:bg-card hover:shadow-sm transition-all duration-200 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
    <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
      {icon && (
        <div className="text-muted-foreground">
          {icon}
        </div>
      )}
      <span className={`text-muted-foreground font-medium ${locale === 'ar' ? 'text-xs' : 'text-sm'}`}>{label}</span>
    </div>
    <span className={`text-foreground font-semibold ${locale === 'ar' ? 'text-xs' : 'text-sm'}`}>{value}</span>
  </div>
);

export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();

  // normalization is handled by useChildren
  const eid = status === "authenticated" ? (session?.user?.emiratesId || '') : undefined;
  const { children, error, isLoading } = useChildren(eid);
  console.log("Children:", children, error, isLoading);
  const isBusy = status === "loading" || (status === "authenticated" && isLoading);

  const SkeletonTableRow = () => (
    <tr className="animate-pulse border-b border-border hover:bg-muted/50">
      <td className="px-6 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/70" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 bg-muted" />
            <Skeleton className="h-3 w-24 bg-muted" />
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <Skeleton className="h-6 w-20 rounded-full bg-muted" />
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-muted" />
          <Skeleton className="h-4 w-16 bg-muted" />
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg bg-muted" />
          <Skeleton className="h-4 w-24 bg-muted" />
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg bg-muted" />
          <Skeleton className="h-4 w-20 bg-muted" />
        </div>
      </td>
      <td className="px-6 py-6">
        <Skeleton className="h-12 w-32 rounded-xl bg-gradient-to-r from-muted to-muted/70" />
      </td>
    </tr>
  );

  return (
    <div className="mb-12">
      {/* Professional Table Container */}
      <div className="relative overflow-hidden bg-card rounded-xl shadow-lg border border-border">
        {/* Modern Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-secondary/8 to-transparent rounded-full translate-y-32 -translate-x-32" />
        
        <div className="relative overflow-x-auto">
          <table className={`w-full ${locale === 'ar' ? 'direction-rtl' : 'direction-ltr'}`}>
            {/* Professional Table Header */}
            <thead>
              <tr className="border-b border-border bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm">
                <th className={`px-6 py-6 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-foreground uppercase tracking-wider`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-bold">{locale === 'ar' ? 'الطالب' : 'Student'}</span>
                  </div>
                </th>
                <th className={`px-6 py-6 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-foreground uppercase tracking-wider`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-chart-2/20 rounded-lg">
                      <svg className="w-4 h-4 text-chart-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" />
                      </svg>
                    </div>
                    <span className="font-bold">{t.student?.gender || (locale === 'ar' ? 'الجنس' : 'Gender')}</span>
                  </div>
                </th>
                <th className={`px-6 py-6 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-foreground uppercase tracking-wider`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-chart-3/20 rounded-lg">
                      <svg className="w-4 h-4 text-chart-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-bold">{t.student?.age || (locale === 'ar' ? 'العمر' : 'Age')}</span>
                  </div>
                </th>
                <th className={`px-6 py-6 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-foreground uppercase tracking-wider`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-chart-4/20 rounded-lg">
                      <svg className="w-4 h-4 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-bold">{t.student?.nationality || (locale === 'ar' ? 'الجنسية' : 'Nationality')}</span>
                  </div>
                </th>
                <th className={`px-6 py-6 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-foreground uppercase tracking-wider`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-chart-5/20 rounded-lg">
                      <svg className="w-4 h-4 text-chart-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-bold">{t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date')}</span>
                  </div>
                </th>
                <th className={`px-6 py-6 text-center ${locale === 'ar' ? 'text-sm font-semibold' : 'text-sm font-bold'} text-foreground uppercase tracking-wider`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-1.5 bg-secondary/20 rounded-lg">
                      <svg className="w-4 h-4 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <span className="font-bold">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Enhanced Loading State */}
              {isBusy && (!children || children.length === 0) && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonTableRow key={`skeleton-${i}`} />
                  ))}
                </>
              )}
              
              {/* Professional Error State */}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-destructive/10 to-destructive/20 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {locale === 'ar' ? 'حدث خطأ' : 'Something went wrong'}
                        </h3>
                        <p className="text-destructive font-medium max-w-md">
                          {error instanceof Error ? error.message : String(error)}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Students Data */}
              {(children ?? []).map((child: Person) => {
                const displayName = locale === 'ar'
                  ? [child.givenName, child.middleName, child.familyName].filter(Boolean).join(' ')
                  : [child.metadata?.englishFirstName, child.metadata?.englishSecondName, child.metadata?.englishThirdName, child.metadata?.englishFamilyName].filter(Boolean).join(' ');
                const displayNationality = locale === 'ar'
                  ? child.metadata?.nationalityArabic || child.metadata?.nationality || ''
                  : child.metadata?.nationality || '';
                const gender = child.metadata?.gender || '';
                const birthDate = child.metadata?.birthDate || '';
                const age = calculateAge(birthDate);
                const formattedBirthDate = formatDate(birthDate, locale);

                const genderLabel = (() => {
                  const g = gender?.toLowerCase();
                  if (g === 'm' || g === 'male' || g === 'ذكر') {
                    return t.student?.male || (locale === 'ar' ? 'ذكر' : 'Male');
                  } else if (g === 'f' || g === 'female' || g === 'أنثى') {
                    return t.student?.female || (locale === 'ar' ? 'أنثى' : 'Female');
                  } else {
                    return gender || "—";
                  }
                })();

                return (
                  <tr 
                    key={child.sourcedId}
                    className="group border-b border-border hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 transition-all duration-300"
                  >
                    {/* Enhanced Student Name & Avatar */}
                    <td className="px-6 py-6">
                      <div className={`flex items-center gap-4 ${locale === 'ar' ? 'flex-row' : ''}`}>
                        <div className="relative group/avatar">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md group-hover/avatar:shadow-lg transition-all duration-300 group-hover:scale-105 ring-2 ring-card">
                            <span className="text-xl font-bold text-primary-foreground">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-chart-2 rounded-full border-3 border-card flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <div className={`${locale === 'ar' ? 'text-base font-semibold' : 'text-lg font-bold'} text-foreground group-hover:text-primary transition-colors`}>
                            {displayName}
                          </div>
                          <div className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1 font-medium`}>
                            ID: {child.sourcedId?.slice(-8) || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Enhanced Gender */}
                    <td className="px-6 py-6">
                      <Badge 
                        className={`${genderLabel.toLowerCase().includes('male') || genderLabel.includes('ذكر') 
                          ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20' 
                          : 'bg-secondary/10 border-secondary/20 text-secondary-foreground hover:bg-secondary/20'} ${locale === 'ar' ? 'text-xs font-medium px-3 py-1.5' : 'text-sm font-medium px-3 py-1.5'} transition-colors duration-200`}
                      >
                        <svg className={`w-3 h-3 ${locale === 'ar' ? 'ml-1.5' : 'mr-1.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {genderLabel}
                      </Badge>
                    </td>

                    {/* Enhanced Age */}
                    <td className="px-6 py-6">
                      {age > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-chart-3/20 to-chart-3/30 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-base font-bold text-chart-3">{age}</span>
                          </div>
                          <span className={`${locale === 'ar' ? 'text-sm' : 'text-sm'} text-muted-foreground font-medium`}>
                            {t.student?.years || (locale === 'ar' ? 'سنة' : 'years')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-medium">—</span>
                      )}
                    </td>

                    {/* Enhanced Nationality */}
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-chart-4/20 rounded-lg">
                          <svg className="w-4 h-4 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className={`${locale === 'ar' ? 'text-sm' : 'text-sm'} text-foreground font-medium truncate max-w-32`}>
                          {displayNationality || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Enhanced Birth Date */}
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-chart-5/20 rounded-lg">
                          <svg className="w-4 h-4 text-chart-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className={`${locale === 'ar' ? 'text-sm' : 'text-sm'} text-foreground font-medium`}>
                          {formattedBirthDate || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Enhanced Actions */}
                    <td className="px-6 py-6">
                      <Link
                        href={`/child/${child.sourcedId}`}
                        className={clsx(
                          "inline-flex items-center gap-3 px-5 py-3 text-sm font-semibold",
                          "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary",
                          "text-primary-foreground rounded-xl shadow-md hover:shadow-lg",
                          "transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                          "hover:scale-105 group/button transform",
                          locale === 'ar' && 'flex-row-reverse'
                        )}
                        aria-label={`${t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')} ${displayName}`}
                      >
                        <svg className="w-4 h-4 transition-transform group-hover/button:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="font-bold">{locale === 'ar' ? 'عرض الملف' : 'View Profile'}</span>
                        <ChevronRightIcon className={clsx(
                          "w-4 h-4 transition-all duration-200 group-hover/button:scale-110",
                          locale === 'ar' ? 'rotate-180 group-hover/button:-translate-x-1' : 'group-hover/button:translate-x-1'
                        )} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Empty State */}
      {status === "authenticated" && !isBusy && !error && (!children || children.length === 0) && (
        <div className="mt-8">
          <div className="relative overflow-hidden bg-card rounded-xl shadow-lg border border-border">
            {/* Modern Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-40 translate-x-40" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-secondary/8 to-transparent rounded-full translate-y-32 -translate-x-32" />
            
            <div className="relative p-20 text-center">
              <div className="max-w-lg mx-auto">
                <div className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-xl ring-4 ring-card">
                  <svg className="w-14 h-14 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className={clsx(
                  "text-3xl font-bold text-foreground mb-4",
                  locale === 'ar' && "text-2xl leading-relaxed"
                )}>
                  {locale === 'ar' ? 'لا توجد بيانات طلاب' : 'No Students Found'}
                </h3>
                <p className={clsx(
                  "text-lg text-muted-foreground mb-8 leading-relaxed",
                  locale === 'ar' && "text-base"
                )}>
                  {t.dashboard?.noLinkedStudents || (locale === 'ar' ? 'لم يتم العثور على طلاب مرتبطين بحسابك. تحقق من إعدادات الحساب أو تواصل مع الإدارة.' : 'No linked students found for your account. Please check your account settings or contact administration.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className={clsx(
                    "inline-flex items-center gap-3 px-6 py-3 text-sm font-semibold",
                    "text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl shadow-sm hover:shadow-md",
                    "transition-all duration-200 border border-border hover:border-border/80"
                  )}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locale === 'ar' ? 'تحقق من إعدادات الحساب' : 'Check Account Settings'}
                  </div>
                  <div className={clsx(
                    "inline-flex items-center gap-3 px-6 py-3 text-sm font-semibold",
                    "text-primary bg-primary/10 hover:bg-primary/20 rounded-xl shadow-sm hover:shadow-md",
                    "transition-all duration-200 border border-primary/20 hover:border-primary/30"
                  )}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locale === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
