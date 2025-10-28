"use client";

import React from "react";
import useSWR from "swr";
import { useChildren } from "@/lib/hooks/useChildren";
import type { StudentProfileV1 } from "@/app/types/studentprofile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { jsonFetcher } from "@/lib/swr";
import ChildActions from "./ChildActions";

// Avatar with dynamic status indicator based on update information status
const StatusIndicatorAvatar = ({ studentPersonId, displayName, locale }: { studentPersonId: string; displayName: string; locale: string }) => {
  const params = new URLSearchParams({ studentPersonId });
  const { data } = useSWR<{ ok: boolean; data?: { 
    isInfoUpdateRequested?: boolean | null;
    infoUpdateRequestStatus?: number | null;
    isConductAgreementSigned?: boolean | null;
  } }>(
    `/api/parent/update-information-requests?${params.toString()}`,
    jsonFetcher
  );

  const row = data?.data;
  const needsUpdate = !row?.isInfoUpdateRequested;
  const status = row?.infoUpdateRequestStatus ?? null;
  const inProgress = status === 1 || status === 2;
  const approved = status === 3;
  const rejected = status === 4;
  const needsConductSign = approved && !row?.isConductAgreementSigned;
  const allComplete = approved && row?.isConductAgreementSigned;

  // Determine status indicator color and icon
  const getStatusConfig = () => {
    if (needsUpdate) {
      return {
        bgColor: 'bg-destructive',
        message: locale === 'ar' ? 'مطلوب تحديث المعلومات' : 'Information Update Required',
        icon: (
          <svg className="w-3.5 h-3.5 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 5h2v6H9V5zm0 8h2v2H9v-2z" clipRule="evenodd" />
          </svg>
        )
      };
    }
    if (inProgress) {
      return {
        bgColor: 'bg-chart-1',
        message: locale === 'ar' ? 'قيد المراجعة' : 'Under Review',
        icon: (
          <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )
      };
    }
    if (rejected) {
      return {
        bgColor: 'bg-destructive',
        message: locale === 'ar' ? 'تم الرفض' : 'Rejected',
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      };
    }
    if (needsConductSign) {
      return {
        bgColor: 'bg-primary',
        message: locale === 'ar' ? 'يتطلب توقيع اتفاقية السلوك' : 'Conduct Agreement Signature Required',
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      };
    }
    if (allComplete) {
      return {
        bgColor: 'bg-chart-2',
        message: locale === 'ar' ? 'مكتمل' : 'Complete',
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      };
    }
    // Default - no indicator
    return null;
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="relative flex-shrink-0 group/status">
      <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-card group-hover:scale-105 transition-transform duration-300">
        <span className="text-2xl font-bold text-primary-foreground">
          {displayName.charAt(0).toUpperCase()}
        </span>
      </div>
      {statusConfig && (
        <>
          <div className={clsx(
            "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-card flex items-center justify-center shadow-lg",
            statusConfig.bgColor
          )}>
            {statusConfig.icon}
          </div>
          {/* Status message tooltip */}
          <div className={clsx(
            "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg",
            "bg-popover text-popover-foreground text-xs font-medium whitespace-nowrap shadow-lg border border-border",
            "opacity-0 group-hover/status:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
          )}>
            {statusConfig.message}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-popover" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Desktop version with smaller size
const StatusIndicatorAvatarDesktop = ({ studentPersonId, displayName, locale }: { studentPersonId: string; displayName: string; locale: string }) => {
  const params = new URLSearchParams({ studentPersonId });
  const { data } = useSWR<{ ok: boolean; data?: { 
    isInfoUpdateRequested?: boolean | null;
    infoUpdateRequestStatus?: number | null;
    isConductAgreementSigned?: boolean | null;
  } }>(
    `/api/parent/update-information-requests?${params.toString()}`,
    jsonFetcher
  );

  const row = data?.data;
  const needsUpdate = !row?.isInfoUpdateRequested;
  const status = row?.infoUpdateRequestStatus ?? null;
  const inProgress = status === 1 || status === 2;
  const approved = status === 3;
  const rejected = status === 4;
  const needsConductSign = approved && !row?.isConductAgreementSigned;
  const allComplete = approved && row?.isConductAgreementSigned;

  // Determine status indicator color and icon
  const getStatusConfig = () => {
    if (needsUpdate) {
      return {
        bgColor: 'bg-destructive',
        message: locale === 'ar' ? 'مطلوب تحديث المعلومات' : 'Information Update Required',
        icon: (
          <svg className="w-3 h-3 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 5h2v6H9V5zm0 8h2v2H9v-2z" clipRule="evenodd" />
          </svg>
        )
      };
    }
    if (inProgress) {
      return {
        bgColor: 'bg-chart-1',
        message: locale === 'ar' ? 'قيد المراجعة' : 'Under Review',
        icon: (
          <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )
      };
    }
    if (rejected) {
      return {
        bgColor: 'bg-destructive',
        message: locale === 'ar' ? 'تم الرفض' : 'Rejected',
        icon: (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      };
    }
    if (needsConductSign) {
      return {
        bgColor: 'bg-primary',
        message: locale === 'ar' ? 'يتطلب توقيع اتفاقية السلوك' : 'Conduct Agreement Signature Required',
        icon: (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      };
    }
    if (allComplete) {
      return {
        bgColor: 'bg-chart-2',
        message: locale === 'ar' ? 'مكتمل' : 'Complete',
        icon: (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      };
    }
    // Default - no indicator
    return null;
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="relative flex-shrink-0 group/avatar">
      <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg group-hover/avatar:shadow-2xl transition-all duration-300 group-hover:scale-110 ring-2 ring-card">
        <span className="text-2xl font-bold text-primary-foreground">
          {displayName.charAt(0).toUpperCase()}
        </span>
      </div>
      {statusConfig && (
        <>
          <div className={clsx(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-card flex items-center justify-center shadow-lg",
            statusConfig.bgColor
          )}>
            {statusConfig.icon}
          </div>
          {/* Status message tooltip */}
          <div className={clsx(
            "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg",
            "bg-popover text-popover-foreground text-xs font-medium whitespace-nowrap shadow-lg border border-border",
            "opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
          )}>
            {statusConfig.message}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-popover" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Status Message Badge Component - displays clear status text
const StatusMessageBadge = ({ studentPersonId, locale }: { studentPersonId: string; locale: string }) => {
  const params = new URLSearchParams({ studentPersonId });
  const { data } = useSWR<{ ok: boolean; data?: { 
    isInfoUpdateRequested?: boolean | null;
    infoUpdateRequestStatus?: number | null;
    isConductAgreementSigned?: boolean | null;
  } }>(
    `/api/parent/update-information-requests?${params.toString()}`,
    jsonFetcher
  );

  const row = data?.data;
  const needsUpdate = !row?.isInfoUpdateRequested;
  const status = row?.infoUpdateRequestStatus ?? null;
  const inProgress = status === 1 || status === 2;
  const approved = status === 3;
  const rejected = status === 4;
  const needsConductSign = approved && !row?.isConductAgreementSigned;
  const allComplete = approved && row?.isConductAgreementSigned;

  // Get status config
  const getStatusConfig = () => {
    if (needsUpdate) {
      return {
        message: locale === 'ar' ? 'مطلوب تحديث المعلومات' : 'Information Update Required',
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-destructive/30',
        icon: '❗'
      };
    }
    if (inProgress) {
      return {
        message: locale === 'ar' ? 'قيد المراجعة' : 'Under Review',
        bgColor: 'bg-chart-1/10',
        textColor: 'text-chart-1',
        borderColor: 'border-chart-1/30',
        icon: '⏳'
      };
    }
    if (rejected) {
      return {
        message: locale === 'ar' ? 'تم الرفض' : 'Rejected',
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-destructive/30',
        icon: '❌'
      };
    }
    if (needsConductSign) {
      return {
        message: locale === 'ar' ? 'يتطلب توقيع اتفاقية السلوك' : 'Conduct Agreement Signature Required',
        bgColor: 'bg-primary/10',
        textColor: 'text-primary',
        borderColor: 'border-primary/30',
        icon: '✍️'
      };
    }
    if (allComplete) {
      return {
        message: locale === 'ar' ? 'مكتمل' : 'Complete',
        bgColor: 'bg-chart-2/10',
        textColor: 'text-chart-2',
        borderColor: 'border-chart-2/30',
        icon: '✅'
      };
    }
    return null;
  };

  const statusConfig = getStatusConfig();
  
  if (!statusConfig) return null;

  return (
    <Badge 
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border shadow-sm rounded-lg",
        statusConfig.bgColor,
        statusConfig.textColor,
        statusConfig.borderColor,
        locale === 'ar' && 'font-bold '
      )}
    >
      <span className="text-sm">{statusConfig.icon}</span>
      <span>{statusConfig.message}</span>
    </Badge>
  );
};

export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();

  // normalization is handled by useChildren
  const eid = status === "authenticated" ? (session?.user?.emiratesId || '') : undefined;
  const { children, error, isLoading } = useChildren(eid);
  const isBusy = status === "loading" || (status === "authenticated" && isLoading);

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
              <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-destructive/20 to-destructive/30 rounded-3xl flex items-center justify-center  ring-4 ring-destructive/10">
                <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                {locale === 'ar' ? 'حدث خطأ' : 'Something went wrong'}
              </h3>
              <p className="text-sm text-destructive font-medium leading-relaxed">
                {error instanceof Error ? error.message : String(error)}
              </p>
            </div>
          </Card>
        )}

        {/* Mobile Student Cards */}
        {(children ?? []).map((child: StudentProfileV1) => {
          const displayName = locale === 'ar'
            ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic].filter(Boolean).join(' ')
            : [child.firstNameEnglish, child.middleNameEnglish, child.thirdNameEnglish, child.fourthNameEnglish, child.familyNameEnglish].filter(Boolean).join(' ');

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
                  <StatusIndicatorAvatar studentPersonId={child.id} displayName={displayName} locale={locale} />

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
                        {child.studentNumber || child.id.slice(-6)}
                      </Badge>
                      <StatusMessageBadge studentPersonId={child.id} locale={locale} />
                    </div>
                  </div>
                </div>

                {/* Actions Section - Simplified */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <ChildActions studentPersonId={child.id} className="w-full" />
                </div>
              </div>
            </Card>
          );
        })}
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
                        <div className="w-24 h-24 bg-gradient-to-br from-destructive/20 to-destructive/30 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-destructive/10">
                          <svg className="w-12 h-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 bg-destructive/20 rounded-3xl blur-xl -z-10" />
                      </div>
                      <div className="text-center max-w-md">
                        <h3 className="text-xl font-bold text-foreground mb-3">
                          {locale === 'ar' ? 'حدث خطأ' : 'Something went wrong'}
                        </h3>
                        <p className="text-destructive font-semibold leading-relaxed">
                          {error instanceof Error ? error.message : String(error)}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Students Data */}
              {(children ?? []).map((child: StudentProfileV1) => {
                const displayName = locale === 'ar'
                  ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic].filter(Boolean).join(' ')
                  : [child.firstNameEnglish, child.middleNameEnglish, child.thirdNameEnglish, child.fourthNameEnglish, child.familyNameEnglish].filter(Boolean).join(' ');

                return (
                  <tr 
                    key={child.id}
                    className="group border-b border-border/40 hover:bg-gradient-to-r hover:from-primary/8 hover:via-primary/5 hover:to-transparent transition-all duration-300"
                  >
                    {/* Enhanced Student Name & Avatar */}
                    <td className="px-8 py-6">
                      <div className={clsx("flex items-center gap-5", locale === 'ar' && '')}>
                        <StatusIndicatorAvatarDesktop studentPersonId={child.id} displayName={displayName} locale={locale} />
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
                            <StatusMessageBadge studentPersonId={child.id} locale={locale} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Enhanced Actions */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                        <ChildActions studentPersonId={child.id} compact />
                      </div>
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
