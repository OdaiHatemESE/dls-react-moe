"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
import { useI18n } from "@/app/i18n/I18nProvider";
import { jsonFetcher } from "@/lib/swr";
import { stat } from "fs";

export type UpdateInfoRow = {
  Id: number;
  studentPersonId: string;
  parentPersonId?: string | null;
  isInfoUpdateRequested?: boolean | null;
  infoUpdateRequestStatus?: number | null;
  isConductAgreementSigned?: boolean | null;
  conductAgreementStatus?: number | null;
  studentEmirateId?: string | null;
  createAt?: string | null;
  updateAt?: string | null;
};

type Props = {
  studentPersonId: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  compact?: boolean; // when true, render smaller buttons (e.g., inside table)
  className?: string;
};

export function ChildActions({ studentPersonId, parentPersonId, studentEmirateId, compact, className }: Props) {
  const { locale } = useI18n();

  const params = new URLSearchParams({ studentPersonId });
  if (parentPersonId) params.set("parentPersonId", parentPersonId);
  if (studentEmirateId) params.set("studentEmirateId", studentEmirateId);

  const { data, error, isLoading } = useSWR<{ ok: boolean; data?: UpdateInfoRow; error?: string }>(
    `/api/parent/update-information-requests?${params.toString()}`,
    jsonFetcher
  );

  if (isLoading) {
    return (
      <div className={clsx("inline-flex items-center gap-2", className)}>
        <div className="relative h-10 w-32 rounded-xl bg-muted overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    );
  }

  if (error || !data?.ok || !data.data) {
    // Fallback: just show View Profile
    return (
      <div className={clsx("inline-flex items-center gap-2", className)}>
        <Link
          href={`/child/${studentPersonId}`}
          className={clsx(
            compact
              ? "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90"
              : "inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow"
          )}
        >
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </Link>
      </div>
    );
  }

  const row = data.data;
  const infoRequested = !!row.isInfoUpdateRequested;
  const status = row.infoUpdateRequestStatus ?? null; // 1,2=in progress; 3=approved; 4=rejected
  const conductSigned = !!row.isConductAgreementSigned;
  console.log("ChildActions:", { infoRequested, status, conductSigned });

  // Decision matrix from user:
  // - if isInfoUpdateRequested == false -> show "Update Information"
  // - if isInfoUpdateRequested == true -> check isConductAgreementSigned; if false -> show "Sign Conduct" and "View Profile"
  //   (we will show both when infoRequested && !conductSigned). If both true, default to View Profile only.

  const Btn = ({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) => (
    <Link
      href={href}
      className={clsx(
        "group inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation active:scale-95",
        compact
          ? "px-4 py-2 text-xs"
          : "px-5 py-2.5 text-sm",
        variant === "primary" 
          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80" 
          : "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80"
      )}
    >
      {variant === "primary" ? (
        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      ) : (
        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
      {children}
    </Link>
  );

  // Render based on matrix
  // Case 1: No info requested yet
   
  if (!infoRequested) {
    return (
      <div className={clsx("flex items-center gap-2", className)}>
        <Btn href={`/child/${studentPersonId}/update-info`}>
          {locale === "ar" ? "تحديث المعلومات" : "Update Information"}
        </Btn>
      </div>
    );
  }
  
  // Case 2: Requested and status is 1 or 2 => in progress, show message only
  if (status === 1 || status === 2) {
    return (
      <div className={clsx(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
        "bg-gradient-to-r from-chart-1/10 to-chart-1/5 border border-chart-1/20",
        compact ? "text-xs" : "text-sm",
        className
      )}>
        <div className="relative">
          <svg className="w-4 h-4 text-chart-1 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <span className="text-chart-1 font-semibold">
          {locale === "ar" ? "قيد المعالجة..." : "In Progress..."}
        </span>
      </div>
    );
  }

  // Case 3: Requested and status is 4 => rejected
  if (status === 4) {
    return (
      <div className={clsx(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
        "bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20",
        compact ? "text-xs" : "text-sm",
        className
      )}>
        <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-destructive font-semibold">
          {locale === "ar" ? "مرفوض" : "Rejected"}
        </span>
      </div>
    );
  }

  // Case 4: Requested and status is 3 => approved; then check conduct
  if (status === 3) {
    if (!conductSigned) {
      return (
        <div className={clsx("flex flex-wrap items-center gap-2", className)}>
          <Btn href={`/child/${studentPersonId}/conduct`}>
            {locale === "ar" ? "توقيع السلوك" : "Sign Conduct"}
          </Btn>
          <Btn href={`/child/${studentPersonId}`} variant="secondary">
            {locale === "ar" ? "عرض الملف" : "View Profile"}
          </Btn>
        </div>
      );
    }
    // Conduct signed => only view profile
    return (
      <div className={clsx("flex items-center gap-2", className)}>
        <Btn href={`/child/${studentPersonId}`} variant="secondary">
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </Btn>
      </div>
    );
  }

  // Fallback
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Btn href={`/child/${studentPersonId}`} variant="secondary">
        {locale === "ar" ? "عرض الملف" : "View Profile"}
      </Btn>
    </div>
  );
}

export default ChildActions;

// Enhanced status badge to visually indicate required actions
export function ChildStatusBadge({ studentPersonId, parentPersonId, studentEmirateId, className, variant = "default" }: {
  studentPersonId: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  className?: string;
  variant?: "default" | "mobile";
}) {
  const { locale } = useI18n();
  const params = new URLSearchParams({ studentPersonId });
  if (parentPersonId) params.set("parentPersonId", parentPersonId);
  if (studentEmirateId) params.set("studentEmirateId", studentEmirateId);
  const { data } = useSWR<{ ok: boolean; data?: UpdateInfoRow }>(
    `/api/parent/update-information-requests?${params.toString()}`,
    jsonFetcher
  );

  if (!data?.data) return null;

  const row = data.data;
  const needsUpdate = !row.isInfoUpdateRequested;
  const status = row.infoUpdateRequestStatus ?? null;
  const needsConductSign = row.isInfoUpdateRequested && status === 3 && !row.isConductAgreementSigned;

  // Show badge for: needs update OR needs conduct signature
  if (!needsUpdate && !needsConductSign) return null;

  const isUrgent = needsUpdate;
  const label = isUrgent 
    ? (locale === "ar" ? "تحديث مطلوب" : "Update Required")
    : (locale === "ar" ? "يتطلب توقيع" : "Signature Required");
  
  const tooltip = isUrgent
    ? (locale === "ar" ? "تحتاج إلى تحديث المعلومات" : "You need to update information")
    : (locale === "ar" ? "يتطلب توقيع السلوك" : "Conduct signature required");

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-bold transition-all duration-200",
        variant === "mobile" 
          ? "px-2.5 py-1.5 rounded-lg shadow-sm" 
          : "px-2.5 py-1 rounded-lg",
        isUrgent
          ? "bg-gradient-to-r from-destructive/15 to-destructive/10 border border-destructive/30 text-destructive hover:shadow-md"
          : "bg-gradient-to-r from-chart-1/15 to-chart-1/10 border border-chart-1/30 text-chart-1 hover:shadow-md",
        className
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      {isUrgent ? (
        <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 5h2v6H9V5zm0 8h2v2H9v-2z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );
}
