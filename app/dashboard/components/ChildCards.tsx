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

// Enhanced helper components for clean UI
const InfoItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 px-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/80 transition-all duration-200">
    <div className="flex items-center gap-2">
      {icon && (
        <div className="text-blue-600">
          {icon}
        </div>
      )}
      <span className="text-gray-600 text-sm font-medium">{label}</span>
    </div>
    <span className="text-gray-900 font-semibold text-sm">{value}</span>
  </div>
);

export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();

  // normalization is handled by useChildren
  const eid = status === "authenticated" ? (session?.user?.emiratesId || "784198791735438") : undefined;
  const { children, error, isLoading } = useChildren(eid);
  console.log("Children:", children, error, isLoading);
  const isBusy = status === "loading" || (status === "authenticated" && isLoading);

  const SkeletonChildCard = ({ rtl }: { rtl?: boolean }) => (
    <Card className={`group relative overflow-hidden border-0 shadow-xl bg-white transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${rtl ? 'direction-rtl' : 'direction-ltr'}`}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
      
      <CardContent className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Skeleton className="w-16 h-16 rounded-2xl" />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-30" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <Skeleton className="h-12 w-full rounded-xl" />
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {isBusy && (!children || children.length === 0) && (
        <>
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonChildCard key={`skeleton-${i}`} rtl={locale === 'ar'} />
          ))}
        </>
      )}
      {error && (
        <div
          className="col-span-full text-center text-sm text-red-600"
          role="alert"
        >
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}
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
          <Card
            key={child.sourcedId}
            className={`group relative overflow-hidden border-0 shadow-xl bg-white transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${locale === 'ar' ? 'direction-rtl' : 'direction-ltr'}`}
          >
            {/* Enhanced Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-60" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full translate-y-16 -translate-x-16" />
            
            <CardContent className="relative p-8">
              {/* Enhanced Student Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative group/avatar">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/avatar:shadow-xl transition-all duration-300">
                      <span className="text-2xl font-bold text-white drop-shadow-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover/avatar:opacity-50 transition-opacity" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 leading-tight mb-1">
                      {displayName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 text-xs font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {genderLabel}
                      </Badge>
                      {age > 0 && (
                        <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-green-200 text-green-700 text-xs font-medium">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {age} {t.student?.years || (locale === 'ar' ? 'سنة' : 'years')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/child/${child.sourcedId}`}
                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 group/link"
                  aria-label={`${t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')} ${displayName}`}
                >
                  <ChevronRightIcon className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Enhanced Essential Information */}
              <div className="space-y-3 mb-8">
                {displayNationality && (
                  <InfoItem 
                    label={t.student?.nationality || (locale === 'ar' ? 'الجنسية' : 'Nationality')} 
                    value={displayNationality}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  />
                )}
                {formattedBirthDate && (
                  <InfoItem 
                    label={t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date')} 
                    value={formattedBirthDate}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  />
                )}
              </div>

              {/* Enhanced Action Button */}
              <Link
                href={`/child/${child.sourcedId}`}
                className="group/button w-full inline-flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-[1.02]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')}
                <ChevronRightIcon className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
 

      {/* Enhanced Empty State */}
      {status === "authenticated" && !isBusy && !error && (!children || children.length === 0) && (
        <div className="col-span-full">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
            <CardContent className="p-16 text-center relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.1' fill-rule='nonzero'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>
              
              <div className="relative max-w-md mx-auto">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-xl">
                  <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {locale === 'ar' ? 'لا توجد بيانات طلاب' : 'No Students Found'}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {t.dashboard?.noLinkedStudents || (locale === 'ar' ? 'لم يتم العثور على طلاب مرتبطين بحسابك.' : 'No linked students found for your account.')}
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-blue-600 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locale === 'ar' ? 'تحقق من إعدادات الحساب' : 'Check account settings'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
