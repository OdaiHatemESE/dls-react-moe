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

// Helper components for minimalism
const InfoRow = ({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) => (
  <div className={`flex flex-col p-3 bg-gray-50 rounded-lg${colSpan === 2 ? ' col-span-2' : ''}`}>
    <span className="text-gray-500 text-xs font-medium mb-1">{label}</span>
    <span className="text-gray-900 font-semibold">{value}</span>
  </div>
);

const AltName = ({ label, value, rtl }: { label: string; value: string; rtl?: boolean }) => (
  <div className="pt-3 border-t border-gray-100">
    <span className="text-gray-500 text-xs font-medium mb-1 block">{label}</span>
    <span className="text-gray-700 text-sm" {...(rtl ? { dir: 'rtl' } : {})}>{value}</span>
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
    <Card className={`relative border border-gray-200 bg-white rounded-xl overflow-hidden ${rtl ? 'direction-rtl' : 'direction-ltr'}`}>
      <div className="bg-gray-50 p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6">
        <Skeleton className="h-11 w-full rounded-lg" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {isBusy && (!children || children.length === 0) && (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
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
            className={`group relative transition-all duration-300 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl overflow-hidden ${locale === 'ar' ? 'direction-rtl' : 'direction-ltr'}`}
          >
            {/* Header with subtle background */}
            <div className="bg-gray-50 p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Student Avatar/Initial */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                        {displayName}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs px-2 py-1 mt-1 bg-white">
                        ID: {child.sourcedId}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/child/${child.identifier}`}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200"
                  aria-label={`${t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')} ${displayName}`}
                  title={t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoRow label={t.student?.gender || (locale === 'ar' ? 'الجنس' : 'Gender')} value={genderLabel} />
                  {(age > 0 || formattedBirthDate) && (
                    <InfoRow
                      label={age > 0 ? (t.student?.age || (locale === 'ar' ? 'العمر' : 'Age')) : (t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'))}
                      value={age > 0 ? `${age} ${t.student?.years || (locale === 'ar' ? 'سنة' : 'years')}` : formattedBirthDate}
                    />
                  )}
                  {displayNationality && (
                    <InfoRow
                      label={t.student?.nationality || (locale === 'ar' ? 'الجنسية' : 'Nationality')}
                      value={displayNationality}
                      colSpan={2}
                    />
                  )}
                  {formattedBirthDate && (
                    <InfoRow
                      label={t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date')}
                      value={formattedBirthDate}
                      colSpan={2}
                    />
                  )}
                </div>
                {locale === 'ar' && [child.metadata?.englishFirstName, child.metadata?.englishSecondName, child.metadata?.englishThirdName, child.metadata?.englishFamilyName].some(Boolean) && (
                  <AltName label="English Name" value={[child.metadata?.englishFirstName, child.metadata?.englishSecondName, child.metadata?.englishThirdName, child.metadata?.englishFamilyName].filter(Boolean).join(' ')} />
                )}
                {locale === 'en' && child.givenName && (
                  <AltName label="الاسم بالعربية" value={[child.givenName, child.middleName, child.familyName].filter(Boolean).join(' ')} rtl />
                )}
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Link
                href={`/child/${child.sourcedId}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')}
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </CardFooter>
          </Card>
        );
      })}
 

      {/* If no children fetched and not loading/error, show helpful message */}
      {status === "authenticated" && !isBusy && !error && (!children || children.length === 0) && (
        <div className="col-span-full text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              {t.dashboard?.noLinkedStudents || (locale === 'ar' ? 'لم يتم العثور على طلاب مرتبطين بحسابك.' : 'No linked students found for your account.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
