"use client";

import React from "react";
import Link from "next/link";
import { useChildren } from "@/lib/hooks/useChildren";
import type { StudentProfileV1 } from "@/app/types/studentprofile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import ChildActions, { ChildStatusBadge } from "./ChildActions";

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

/**
 * Mobile avatar component (status indicator removed).
 */
const ChildAvatar = ({ displayName }: { displayName: string }) => (
  <div className="relative flex-shrink-0">
    <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-card transition-transform duration-300">
      <span className="text-2xl font-bold text-primary-foreground">
        {displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  </div>
);

/**
 * Desktop avatar component (status indicator removed).
 */
const ChildAvatarDesktop = ({ displayName }: { displayName: string }) => (
  <div className="relative flex-shrink-0">
    <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ring-2 ring-card">
      <span className="text-2xl font-bold text-primary-foreground">
        {displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  </div>
);


export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();

  // normalization is handled by useChildren
  const eid = status === "authenticated" ? (session?.user?.emiratesId || '') : undefined;
  const { children, error, isLoading, needsSync, emirateId } = useChildren(eid);
  const isBusy = status === "loading" || (status === "authenticated" && isLoading);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Group children by active status
  const groupedChildren = React.useMemo(() => {
    if (!children || children.length === 0) {
      return { active: [], inactive: [] };
    }

    const active: StudentProfileV1[] = [];
    const inactive: StudentProfileV1[] = [];

    children.forEach((child) => {
      if (child.isActive) {
        active.push(child);
      } else {
        inactive.push(child);
      }
    });

    return { active, inactive };
  }, [children]);

  const handleSync = React.useCallback(async () => {
    if (!emirateId) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/PP/child/sync?emirateId=${encodeURIComponent(emirateId)}`);
      if (response.ok) {
        // Refresh the page or trigger SWR revalidation
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to sync data');
      }
    } catch (err) {
      alert('Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  }, [emirateId]);

  // Skeleton loaders with shimmer effect
  const SkeletonTableRow = () => (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      {/* Student */}
      <td className="px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-muted via-muted/80 to-muted/60 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="relative h-5 w-40 rounded-lg bg-muted overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <div className="relative h-4 w-28 rounded-lg bg-muted/70 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </div>
        </div>
      </td>
      {/* Actions */}
      <td className="px-6 py-6">
        <div className="relative h-10 w-36 rounded-xl bg-gradient-to-r from-muted to-muted/70 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Mobile-First Responsive Design */}
      
      {/* Mobile Cards Layout (Hidden on Desktop) */}
      <div className="block lg:hidden space-y-4">
        {/* Loading State for Mobile */}
        {isBusy && (!children || children.length === 0) && (
          <>
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={`mobile-skeleton-${i}`} className="relative overflow-hidden border-border/50 ">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                <div className="relative p-5">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-muted via-muted/80 to-muted/60 overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="relative h-5 w-36 rounded-lg bg-muted overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                      <div className="relative h-4 w-24 rounded-lg bg-muted/70 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="relative h-12 w-full rounded-xl bg-muted overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                    <div className="relative h-11 w-full rounded-xl bg-muted/80 overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {/* Error State for Mobile */}
        {error && (
          <Card className="relative overflow-hidden border-destructive/20 ">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-destructive/10" />
            <div className="relative p-8 text-center">
              <div className={`w-20 h-20 mx-auto mb-5 bg-gradient-to-br ${needsSync ? 'from-primary/20 to-primary/30' : 'from-destructive/20 to-destructive/30'} rounded-3xl flex items-center justify-center ring-4 ${needsSync ? 'ring-primary/10' : 'ring-destructive/10'}`}>
                {needsSync ? (
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                {needsSync 
                  ? (locale === 'ar' ? 'مرحباً بك!' : 'Welcome!')
                  : (locale === 'ar' ? 'حدث خطأ' : 'Something went wrong')
                }
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-2">
                {needsSync 
                  ? (locale === 'ar' 
                    ? 'نحتاج إلى جلب بيانات أطفالك للمرة الأولى. قد يستغرق هذا بضع ثوانٍ.'
                    : 'We need to fetch your children\'s data for the first time. This will only take a few seconds.')
                  : (error instanceof Error ? error.message : String(error))
                }
              </p>
              {needsSync && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {locale === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {locale === 'ar' ? 'مزامنة البيانات' : 'Sync Data'}
                    </>
                  )}
                </button>
              )}
            </div>
          </Card>
        )}

        {/* Mobile Student Cards - Grouped by Status */}
        {groupedChildren.active.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                {locale === 'ar' ? 'الطلاب النشطون' : 'Active Students'} ({groupedChildren.active.length})
              </h3>
            </div>
            <div className="space-y-4">
              {groupedChildren.active.map((child: StudentProfileV1) => {
                const displayName = locale === 'ar'
                  ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic].filter(Boolean).join(' ')
                  : [child.firstNameEnglish, child.middleNameEnglish, child.thirdNameEnglish, child.fourthNameEnglish, child.familyNameEnglish].filter(Boolean).join(' ');

                const resolvedStudentNumber = child.studentNumber?.trim() || null;
                const resolvedAcademicYear = resolvedStudentNumber ? deriveAcademicYear(child.enrollment) : undefined;
                const latestEnrollment = resolveLatestEnrollment(child.enrollment);
                const educationType = latestEnrollment?.educationType ?? null;
                const schoolYear = latestEnrollment?.schoolYear ?? null;

                return (
                  <Card 
                    key={child.id} 
                    className={clsx(
                      "group relative overflow-hidden transition-all duration-300",
                      "border-border/60 hover:shadow-2xl",
                      "touch-manipulation active:scale-[0.98]"
                    )}
                  >
                    {/* Background gradient - muted for inactive */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 via-transparent to-slate-50/30" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/20 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    
                    <div className="relative p-5">
                      {/* Student Header */}
                      <div className="flex items-center gap-4 mb-5">
                        {/* Avatar with muted colors */}
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 bg-gradient-to-br from-slate-400 via-slate-400/90 to-slate-400/70 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-card">
                            <span className="text-2xl font-bold text-slate-100">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-muted-foreground truncate mb-3">
                          {displayName}
                        </h3>
                          {/* ID and Status Badge on same line */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-muted/50 border-border/70">
                              <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              {child.studentNumber || child.id?.slice(-6) || '—'}
                            </Badge>
                            {child.isActive !== undefined && (
                              <Badge 
                                variant={child.isActive ? "default" : "secondary"}
                                className={clsx(
                                  "text-xs px-2.5 py-1 font-semibold",
                                  child.isActive 
                                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" 
                                    : "bg-slate-500/15 text-slate-600 border-slate-400/30"
                                )}
                              >
                                <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="currentColor" viewBox="0 0 20 20">
                                  <circle cx="10" cy="10" r="4" />
                                </svg>
                                {child.isActive 
                                  ? (locale === 'ar' ? 'نشط' : 'Active')
                                  : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                              </Badge>
                            )}
                            <ChildStatusBadge studentPersonId={child.id} variant="mobile" />
                          </div>
                        </div>
                      </div>
                      {/* Actions Section - Simplified */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <ChildActions
                          studentPersonId={child.id}
                          studentNumber={resolvedStudentNumber}
                          academicYear={resolvedAcademicYear}
                          educationType={educationType}
                          schoolYear={schoolYear}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {groupedChildren.inactive.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                {locale === 'ar' ? 'الطلاب غير النشطين' : 'Inactive Students'} ({groupedChildren.inactive.length})
              </h3>
            </div>
            <div className="space-y-4">
              {groupedChildren.inactive.map((child: StudentProfileV1) => {
          const displayName = locale === 'ar'
            ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic].filter(Boolean).join(' ')
            : [child.firstNameEnglish, child.middleNameEnglish, child.thirdNameEnglish, child.fourthNameEnglish, child.familyNameEnglish].filter(Boolean).join(' ');

          const resolvedStudentNumber = child.studentNumber?.trim() || null;
          const resolvedAcademicYear = resolvedStudentNumber ? deriveAcademicYear(child.enrollment) : undefined;
          const latestEnrollment = resolveLatestEnrollment(child.enrollment);
          const educationType = latestEnrollment?.educationType ?? null;
          const schoolYear = latestEnrollment?.schoolYear ?? null;

          return (
            <Card 
              key={child.id} 
              className={clsx(
                "group relative overflow-hidden transition-all duration-300",
                "border-border/60  hover:shadow-2xl",
                "touch-manipulation active:scale-[0.98]"
              )}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative p-5">
                {/* Student Header */}
                <div className="flex items-center gap-4 mb-5">
                  {/* Avatar with status indicator */}
                  <ChildAvatar displayName={displayName} />

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground truncate mb-3 group-hover:text-primary transition-colors">
                      {displayName}
                    </h3>
                    {/* ID and Status Badge on same line */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-muted/50 border-border/70">
                        <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        {child.studentNumber || child.id?.slice(-6) || '—'}
                      </Badge>
                      {child.isActive !== undefined && (
                        <Badge 
                          variant={child.isActive ? "default" : "secondary"}
                          className={clsx(
                            "text-xs px-2.5 py-1 font-semibold",
                            child.isActive 
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" 
                              : "bg-slate-500/15 text-slate-600 border-slate-400/30"
                          )}
                        >
                          <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="4" />
                          </svg>
                          {child.isActive 
                            ? (locale === 'ar' ? 'نشط' : 'Active')
                            : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      )}
                      <ChildStatusBadge studentPersonId={child.id} variant="mobile" />
                    </div>
                  </div>
                </div>
                {/* Actions Section - Simplified */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Link
                    href={`/child/${child.id}`}
                    className={clsx(
                      "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200",
                      "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
                      "border border-border/60 hover:border-border shadow-sm hover:shadow-md",
                      "touch-manipulation active:scale-95"
                    )}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{locale === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}</span>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table Layout (Hidden on Mobile) */}
      <div className="hidden lg:block relative !mt-0      ">
        {/* Elegant Background Pattern */}  
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-48 translate-x-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/8 to-transparent rounded-full translate-y-40 -translate-x-40 blur-3xl" />
        
        <div className="relative overflow-x-auto">
          <table className={clsx("w-full", locale === 'ar' ? 'direction-rtl' : 'direction-ltr')}>
            {/* Professional Table Header */}
            <thead>
              <tr className="border-b-2 border-border/70 bg-gradient-to-r from-muted/70 via-muted/50 to-muted/30 backdrop-blur-md">
                <th className={clsx(
                  "px-8 py-5 text-left uppercase tracking-wide",
                  locale === 'ar' ? 'text-right' : '',
                  "text-sm font-bold text-foreground"
                )}>
                  <div className={clsx("flex items-center gap-3", locale === 'ar' && '')}>
                    <div className="p-2 bg-primary/15 rounded-xl shadow-sm">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span>{locale === 'ar' ? 'الطالب' : 'Student'}</span>
                  </div>
                </th>
                <th className={clsx(
                  "px-8 py-5 text-center uppercase tracking-wide",
                  "text-sm font-bold text-foreground"
                )}>
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-xl shadow-sm">
                      <svg className="w-5 h-5 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <span>{locale === 'ar' ? 'الإجراءات' : 'Actions'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
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
                  <td colSpan={3} className="px-8 py-20">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className={`w-24 h-24 bg-gradient-to-br ${needsSync ? 'from-primary/20 to-primary/30' : 'from-destructive/20 to-destructive/30'} rounded-3xl flex items-center justify-center shadow-2xl ring-4 ${needsSync ? 'ring-primary/10' : 'ring-destructive/10'}`}>
                          {needsSync ? (
                            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          ) : (
                            <svg className="w-12 h-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className={`absolute inset-0 ${needsSync ? 'bg-primary/20' : 'bg-destructive/20'} rounded-3xl blur-xl -z-10`} />
                      </div>
                      <div className="text-center max-w-md">
                        <h3 className="text-xl font-bold text-foreground mb-3">
                          {needsSync 
                            ? (locale === 'ar' ? 'مرحباً بك!' : 'Welcome!')
                            : (locale === 'ar' ? 'حدث خطأ' : 'Something went wrong')
                          }
                        </h3>
                        <p className={needsSync ? "text-muted-foreground font-medium leading-relaxed mb-4" : "text-destructive font-semibold leading-relaxed"}>
                          {needsSync 
                            ? (locale === 'ar' 
                              ? 'نحتاج إلى جلب بيانات أطفالك للمرة الأولى. الرجاء النقر على الزر أدناه للبدء. قد يستغرق هذا بضع ثوانٍ فقط.'
                              : 'We need to fetch your children\'s data for the first time. Please click the button below to get started. This will only take a few seconds.')
                            : (error instanceof Error ? error.message : String(error))
                          }
                        </p>
                        {needsSync && (
                          <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-3"
                          >
                            {isSyncing ? (
                              <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {locale === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {locale === 'ar' ? 'مزامنة البيانات' : 'Sync Data'}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Students Data - Grouped */}
              {groupedChildren.active.length > 0 && (
                <>
                  <tr className="bg-gradient-to-r from-emerald-50/50 to-emerald-50/20">
                    <td colSpan={2} className="px-8 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                          {locale === 'ar' ? 'الطلاب النشطون' : 'Active Students'} ({groupedChildren.active.length})
                        </h3>
                      </div>
                    </td>
                  </tr>
                  {groupedChildren.active.map((child: StudentProfileV1) => {
                const displayName = locale === 'ar'
                  ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic].filter(Boolean).join(' ')
                  : [child.firstNameEnglish, child.middleNameEnglish, child.thirdNameEnglish, child.fourthNameEnglish, child.familyNameEnglish].filter(Boolean).join(' ');

                const resolvedStudentNumber = child.studentNumber?.trim() || null;
                const resolvedAcademicYear = resolvedStudentNumber ? deriveAcademicYear(child.enrollment) : undefined;
                const latestEnrollment = resolveLatestEnrollment(child.enrollment);
                const educationType = latestEnrollment?.educationType ?? null;
                const schoolYear = latestEnrollment?.schoolYear ?? null;

                return (
                  <tr 
                    key={child.id}
                    className="group border-b border-border/40 hover:bg-gradient-to-r hover:from-primary/8 hover:via-primary/5 hover:to-transparent transition-all duration-300"
                  >
                    {/* Enhanced Student Name & Avatar */}
                    <td className="px-8 py-6">
                      <div className={clsx("flex items-center gap-5", locale === 'ar' && '')}>
                        <ChildAvatarDesktop displayName={displayName} />
                        <div className="flex-1 min-w-0">
                          <div className={clsx(
                            "font-bold text-foreground group-hover:text-primary transition-colors mb-3",
                            locale === 'ar' ? 'text-lg' : 'text-xl'
                          )}>
                            {displayName}
                          </div>
                          {/* ID and Status Badge on same line */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-muted/50 border-border/70">
                              <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              {child.studentNumber || child.id?.slice(-6) || '—'}
                            </Badge>
                            {child.isActive !== undefined && (
                              <Badge 
                                variant={child.isActive ? "default" : "secondary"}
                                className={clsx(
                                  "text-xs px-2.5 py-1 font-semibold",
                                  child.isActive 
                                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" 
                                    : "bg-slate-500/15 text-slate-600 border-slate-400/30"
                                )}
                              >
                                <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="currentColor" viewBox="0 0 20 20">
                                  <circle cx="10" cy="10" r="4" />
                                </svg>
                                {child.isActive 
                                  ? (locale === 'ar' ? 'نشط' : 'Active')
                                  : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                              </Badge>
                            )}
                            <ChildStatusBadge studentPersonId={child.id} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Enhanced Actions */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                        <ChildActions
                          studentPersonId={child.id}
                          studentNumber={resolvedStudentNumber}
                          academicYear={resolvedAcademicYear}
                          educationType={educationType}
                          schoolYear={schoolYear}
                          compact
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
                </>
              )}

              {groupedChildren.inactive.length > 0 && (
                <>
                  <tr className="bg-gradient-to-r from-slate-50/50 to-slate-50/20">
                    <td colSpan={2} className="px-8 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                          {locale === 'ar' ? 'الطلاب غير النشطين' : 'Inactive Students'} ({groupedChildren.inactive.length})
                        </h3>
                      </div>
                    </td>
                  </tr>
                  {groupedChildren.inactive.map((child: StudentProfileV1) => {
                    const displayName = locale === 'ar'
                      ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic].filter(Boolean).join(' ')
                      : [child.firstNameEnglish, child.middleNameEnglish, child.thirdNameEnglish, child.fourthNameEnglish, child.familyNameEnglish].filter(Boolean).join(' ');

                    const resolvedStudentNumber = child.studentNumber?.trim() || null;
                    const resolvedAcademicYear = resolvedStudentNumber ? deriveAcademicYear(child.enrollment) : undefined;
                    const latestEnrollment = resolveLatestEnrollment(child.enrollment);
                    const educationType = latestEnrollment?.educationType ?? null;
                    const schoolYear = latestEnrollment?.schoolYear ?? null;

                    return (
                      <tr 
                        key={child.id}
                        className="group border-b border-border/40 hover:bg-muted/30 transition-all duration-300"
                      >
                        {/* Enhanced Student Name & Avatar */}
                        <td className="px-8 py-6">
                          <div className={clsx("flex items-center gap-5", locale === 'ar' && '')}>
                            <div className="relative flex-shrink-0">
                              <div className="w-16 h-16 bg-gradient-to-br from-slate-400 via-slate-400/90 to-slate-400/70 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-card">
                                <span className="text-2xl font-bold text-slate-100">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={clsx(
                                "font-bold text-muted-foreground mb-3",
                                locale === 'ar' ? 'text-lg' : 'text-xl'
                              )}>
                                {displayName}
                              </div>
                              {/* ID and Status Badge on same line */}
                              <div className="flex flex-wrap items-center gap-2.5">
                                <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-muted/50 border-border/70">
                                  <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                  {child.studentNumber || child.id?.slice(-6) || '—'}
                                </Badge>
                                {child.isActive !== undefined && (
                                  <Badge 
                                    variant={child.isActive ? "default" : "secondary"}
                                    className={clsx(
                                      "text-xs px-2.5 py-1 font-semibold",
                                      child.isActive 
                                        ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" 
                                        : "bg-slate-500/15 text-slate-600 border-slate-400/30"
                                    )}
                                  >
                                    <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="currentColor" viewBox="0 0 20 20">
                                      <circle cx="10" cy="10" r="4" />
                                    </svg>
                                    {child.isActive 
                                      ? (locale === 'ar' ? 'نشط' : 'Active')
                                      : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                                  </Badge>
                                )}
                                <ChildStatusBadge studentPersonId={child.id} />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Enhanced Actions */}
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/child/${child.id}`}
                              className={clsx(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                                "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
                                "border border-border/60 hover:border-border shadow-sm hover:shadow-md"
                              )}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{locale === 'ar' ? 'عرض الملف' : 'View Profile'}</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Empty State */}
      {status === "authenticated" && !isBusy && !error && (!children || children.length === 0) && (
        <div className="mt-8">
          <div className="relative overflow-hidden bg-card rounded-2xl shadow-2xl border border-border/50">
            {/* Elegant Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
            <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-y-32 translate-x-32 md:-translate-y-48 md:translate-x-48 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 md:w-80 md:h-80 bg-gradient-to-tr from-secondary/15 to-transparent rounded-full translate-y-24 -translate-x-24 md:translate-y-40 md:-translate-x-40 blur-3xl" />
            
            <div className="relative p-10 md:p-20 text-center">
              <div className="max-w-2xl mx-auto">
                {/* Animated Icon */}
                <div className="relative inline-block mb-8">
                  <div className="w-28 h-28 md:w-32 md:h-32 mx-auto bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-card group-hover:scale-105 transition-transform">
                    <svg className="w-14 h-14 md:w-16 md:h-16 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-2xl -z-10 animate-pulse" />
                </div>

                {/* Title and Description */}
                <h3 className={clsx(
                  "text-2xl md:text-3xl font-bold text-foreground mb-4",
                  locale === 'ar' && "leading-relaxed"
                )}>
                  {locale === 'ar' ? 'لا توجد بيانات طلاب' : 'No Students Found'}
                </h3>
                <p className={clsx(
                  "text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto",
                  locale === 'ar' && "text-base font-medium"
                )}>
                  {t.dashboard?.noLinkedStudents || (locale === 'ar' 
                    ? 'لم يتم العثور على طلاب مرتبطين بحسابك. تحقق من إعدادات الحساب أو تواصل مع الإدارة.' 
                    : 'No linked students found for your account. Please check your account settings or contact administration.')}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className={clsx(
                    "group inline-flex items-center justify-center gap-3 px-6 py-3.5 text-sm font-semibold rounded-xl",
                    "text-muted-foreground bg-muted/60 hover:bg-muted border border-border/60 hover:border-border",
                    "shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-95"
                  )}>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{locale === 'ar' ? 'تحقق من إعدادات الحساب' : 'Check Account Settings'}</span>
                  </button>
                  <button className={clsx(
                    "group inline-flex items-center justify-center gap-3 px-6 py-3.5 text-sm font-semibold rounded-xl",
                    "text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/40",
                    "shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-95"
                  )}>
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{locale === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
