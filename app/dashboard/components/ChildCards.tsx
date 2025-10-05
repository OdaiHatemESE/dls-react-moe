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

// Enhanced helper components for clean UI with eye-friendly colors
const InfoItem = ({ label, value, icon, locale }: { label: string; value: string; icon?: React.ReactNode; locale?: string }) => (
  <div className={`flex items-center justify-between py-3 px-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all duration-200 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
    <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
      {icon && (
        <div className="text-gray-600">
          {icon}
        </div>
      )}
      <span className={`text-gray-600 font-medium ${locale === 'ar' ? 'text-xs' : 'text-sm'}`}>{label}</span>
    </div>
    <span className={`text-gray-900 font-semibold ${locale === 'ar' ? 'text-xs' : 'text-sm'}`}>{value}</span>
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
    <tr className="animate-pulse border-b border-gray-100 hover:bg-gray-50/50">
      <td className="px-6 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-6 py-6">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-6">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-6">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="px-6 py-6">
        <Skeleton className="h-8 w-24 rounded-lg" />
      </td>
    </tr>
  );

  return (
    <div className="mb-12">
      {/* Creative Table Container */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-aegold-50/30 via-white to-aegreen-50/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-aegold-200/10 to-transparent rounded-full -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-aegreen-200/10 to-transparent rounded-full translate-y-32 -translate-x-32" />
        
        <div className="relative overflow-x-auto">
          <table className={`w-full ${locale === 'ar' ? 'direction-rtl' : 'direction-ltr'}`}>
            {/* Enhanced Table Header */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className={`px-6 py-5 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-gray-900 uppercase tracking-wider`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {locale === 'ar' ? 'الطالب' : 'Student'}
                  </div>
                </th>
                <th className={`px-6 py-5 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-gray-900 uppercase tracking-wider`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" />
                    </svg>
                    {t.student?.gender || (locale === 'ar' ? 'الجنس' : 'Gender')}
                  </div>
                </th>
                <th className={`px-6 py-5 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-gray-900 uppercase tracking-wider`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t.student?.age || (locale === 'ar' ? 'العمر' : 'Age')}
                  </div>
                </th>
                <th className={`px-6 py-5 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-gray-900 uppercase tracking-wider`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.student?.nationality || (locale === 'ar' ? 'الجنسية' : 'Nationality')}
                  </div>
                </th>
                <th className={`px-6 py-5 text-left ${locale === 'ar' ? 'text-right text-sm font-semibold' : 'text-sm font-bold'} text-gray-900 uppercase tracking-wider`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date')}
                  </div>
                </th>
                <th className={`px-6 py-5 text-center ${locale === 'ar' ? 'text-sm font-semibold' : 'text-sm font-bold'} text-gray-900 uppercase tracking-wider`}>
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Loading State */}
              {isBusy && (!children || children.length === 0) && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonTableRow key={`skeleton-${i}`} />
                  ))}
                </>
              )}
              
              {/* Error State */}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-600 font-medium">
                        {error instanceof Error ? error.message : String(error)}
                      </p>
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
                    className="group border-b border-gray-100 hover:bg-gradient-to-r hover:from-aegold-50/30 hover:to-aegreen-50/30 transition-all duration-300"
                  >
                    {/* Student Name & Avatar */}
                    <td className="px-6 py-6">
                      <div className={`flex items-center gap-4 ${locale === 'ar' ? 'flex-row' : ''}`}>
                        <div className="relative group/avatar">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm group-hover/avatar:shadow-md transition-all duration-300 group-hover:scale-105">
                            <span className="text-lg font-bold text-gray-600">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <div className={`${locale === 'ar' ? 'text-sm font-semibold' : 'text-base font-bold'} text-gray-900 group-hover:text-primary transition-colors`}>
                            {displayName}
                          </div>
                          <div className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                            ID: {child.sourcedId?.slice(-8) || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="px-6 py-6">
                      <Badge 
                        variant="outline" 
                        className={`${genderLabel.toLowerCase().includes('male') || genderLabel.includes('ذكر') 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-pink-50 border-pink-200 text-pink-700'} ${locale === 'ar' ? 'text-xs font-normal px-2 py-1' : 'text-xs font-medium'}`}
                      >
                        <svg className={`w-3 h-3 ${locale === 'ar' ? 'ml-1' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {genderLabel}
                      </Badge>
                    </td>

                    {/* Age */}
                    <td className="px-6 py-6">
                      {age > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-aegreen-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-aegreen-700">{age}</span>
                          </div>
                          <span className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-600`}>
                            {t.student?.years || (locale === 'ar' ? 'سنة' : 'years')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Nationality */}
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-700 truncate max-w-32`}>
                          {displayNationality || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Birth Date */}
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-700`}>
                          {formattedBirthDate || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-6">
                      <Link
                        href={`/child/${child.sourcedId}`}
                        className={`inline-flex items-center gap-2 px-4 py-2 ${locale === 'ar' ? 'text-xs font-medium' : 'text-sm font-semibold'} text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 hover:scale-105 group/button ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                        aria-label={`${t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')} ${displayName}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {locale === 'ar' ? 'عرض' : 'View'}
                        <ChevronRightIcon className={`w-3 h-3 transition-transform ${locale === 'ar' ? 'rotate-180 group-hover/button:-translate-x-0.5' : 'group-hover/button:translate-x-0.5'}`} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Empty State for Table */}
      {status === "authenticated" && !isBusy && !error && (!children || children.length === 0) && (
        <div className="mt-8">
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="absolute inset-0 bg-gradient-to-br from-aegold-50/30 via-white to-aegreen-50/30" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-aegold-200/10 to-transparent rounded-full -translate-y-32 translate-x-32" />
            
            <div className="relative p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className={`${locale === 'ar' ? 'text-xl font-semibold' : 'text-2xl font-bold'} text-gray-900 mb-4`}>
                  {locale === 'ar' ? 'لا توجد بيانات طلاب' : 'No Students Found'}
                </h3>
                <p className={`${locale === 'ar' ? 'text-base' : 'text-lg'} text-gray-600 mb-8`}>
                  {t.dashboard?.noLinkedStudents || (locale === 'ar' ? 'لم يتم العثور على طلاب مرتبطين بحسابك.' : 'No linked students found for your account.')}
                </p>
                <div className={`inline-flex items-center gap-2 px-6 py-3 ${locale === 'ar' ? 'text-sm font-normal' : 'text-sm font-medium'} text-gray-600 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locale === 'ar' ? 'تحقق من إعدادات الحساب' : 'Check account settings'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
