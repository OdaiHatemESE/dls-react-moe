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

// Helper components for clean UI
const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-gray-500 text-sm">{label}</span>
    <span className="text-gray-900 font-medium text-sm">{value}</span>
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
    <Card className={`transition-all duration-200 hover:shadow-md border border-gray-200 ${rtl ? 'direction-rtl' : 'direction-ltr'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
            className={`group transition-all duration-200 hover:shadow-md border border-gray-200 shadow-sm ${locale === 'ar' ? 'direction-rtl' : 'direction-ltr'}`}
          >
            <CardContent className="p-6">
              {/* Student Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                      {displayName}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {genderLabel}
                      {age > 0 && ` • ${age} ${t.student?.years || (locale === 'ar' ? 'سنة' : 'years')}`}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/child/${child.sourcedId}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                  aria-label={`${t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')} ${displayName}`}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              </div>

              {/* Essential Information Only */}
              <div className="space-y-3 mb-6">
                {displayNationality && (
                  <InfoItem 
                    label={t.student?.nationality || (locale === 'ar' ? 'الجنسية' : 'Nationality')} 
                    value={displayNationality} 
                  />
                )}
                {formattedBirthDate && (
                  <InfoItem 
                    label={t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date')} 
                    value={formattedBirthDate} 
                  />
                )}
              </div>

              {/* Action Button */}
              <Link
                href={`/child/${child.sourcedId}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')}
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
 

      {/* If no children fetched and not loading/error, show helpful message */}
      {status === "authenticated" && !isBusy && !error && (!children || children.length === 0) && (
        <div className="col-span-full text-center py-16">
          <div className="max-w-sm mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {locale === 'ar' ? 'لا توجد بيانات طلاب' : 'No Students Found'}
            </h3>
            <p className="text-sm text-gray-500">
              {t.dashboard?.noLinkedStudents || (locale === 'ar' ? 'لم يتم العثور على طلاب مرتبطين بحسابك.' : 'No linked students found for your account.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
