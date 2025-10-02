"use client";

import React from "react";
import { useChildren } from "@/lib/hooks/useChildren";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRightIcon,
} from "@/app/components/icons";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";

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

export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();

  // normalization is handled by useChildren
  const eid = status === "authenticated" ? (session?.user?.emiratesId || "784198791735438") : undefined;
  const { children, error, isLoading } = useChildren(eid);
  console.log("Children:", children, error, isLoading);
  const isBusy = status === "loading" || (status === "authenticated" && isLoading);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {isBusy && (
        <div className="col-span-full text-center text-sm text-gray-500">
          {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      )}
      {error && (
        <div
          className="col-span-full text-center text-sm text-red-600"
          role="alert"
        >
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}
      {(children ?? []).map((child) => {
        console.log("odai child :", child);
        console.log("odai child gender:", child.gender, "birthDate:", child.birthDate);
        const displayName = locale === 'ar' ? child.arabicName : 
          [child.englishFirstName, child.englishSecondName, child.englishThirdName, child.englishFamilyName]
            .filter(Boolean).join(' ') || 'odao';
        
        const displayNationality = locale === 'ar' ? child.nationalityArabic : child.nationalityEnglish;
        const age = calculateAge(child.birthDate);
        const formattedBirthDate = formatDate(child.birthDate, locale);

        return (
          <Card
            key={child.id}
            className={`group relative hover:shadow-lg transition-all border border-gray-200 hover:border-blue-300 bg-white ${
              locale === 'ar' ? 'direction-rtl' : 'direction-ltr'
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                    {displayName}
                  </CardTitle>
                  
                  {/* Student ID Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {t.student?.studentId || (locale === 'ar' ? 'رقم الطالب' : 'Student ID')}: {child.id}
                    </Badge>
                  </div>
                </div>
                
                <Link
                  href={`/child/${child.id}`}
                  className="flex-shrink-0 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2 transition-colors"
                  aria-label={`${t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')} ${displayName}`}
                  title={t.student?.viewDetails || (locale === 'ar' ? 'عرض التفاصيل' : 'View Details')}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-4">
              {/* Personal Information Section */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Gender */}
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-medium mb-1">
                      {t.student?.gender || (locale === 'ar' ? 'الجنس' : 'Gender')}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {(() => {
                        const gender = child.gender?.toLowerCase();
                        if (gender === 'm' || gender === 'male' || gender === 'ذكر') {
                          return t.student?.male || (locale === 'ar' ? 'ذكر' : 'Male');
                        } else if (gender === 'f' || gender === 'female' || gender === 'أنثى') {
                          return t.student?.female || (locale === 'ar' ? 'أنثى' : 'Female');
                        } else {
                          return child.gender || "—";
                        }
                      })()} 
                    </span>
                  </div>

                  {/* Age or Birth Date */}
                  {(age > 0 || formattedBirthDate) && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs font-medium mb-1">
                        {age > 0 ? 
                          (t.student?.age || (locale === 'ar' ? 'العمر' : 'Age')) :
                          (t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'))
                        }
                      </span>
                      <span className="text-gray-900 font-medium">
                        {age > 0 ? 
                          `${age} ${t.student?.years || (locale === 'ar' ? 'سنة' : 'years')}` :
                          formattedBirthDate
                        }
                      </span>
                    </div>
                  )}

                  {/* Nationality */}
                  {displayNationality && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-gray-500 text-xs font-medium mb-1">
                        {t.student?.nationality || (locale === 'ar' ? 'الجنسية' : 'Nationality')}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {displayNationality}
                      </span>
                    </div>
                  )}

                  {/* Birth Date */}
                  {formattedBirthDate && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-gray-500 text-xs font-medium mb-1">
                        {t.student?.birthDate || (locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date')}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formattedBirthDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alternative Names Section (if viewing in one language, show the other) */}
                {locale === 'ar' && [child.englishFirstName, child.englishSecondName, child.englishThirdName, child.englishFamilyName].some(Boolean) && (
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-gray-500 text-xs font-medium mb-1 block">
                      English Name
                    </span>
                    <span className="text-gray-700 text-sm">
                      {[child.englishFirstName, child.englishSecondName, child.englishThirdName, child.englishFamilyName]
                        .filter(Boolean).join(' ')}
                    </span>
                  </div>
                )}

                {locale === 'en' && child.arabicName && (
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-gray-500 text-xs font-medium mb-1 block">
                      الاسم بالعربية
                    </span>
                    <span className="text-gray-700 text-sm" dir="rtl">
                      {[child.arabicName, child.arabicSecondName, child.arabicThirdName, child.arabicFamilyName]
                        .filter(Boolean).join(' ')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Link
                href={`/child/${child.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
