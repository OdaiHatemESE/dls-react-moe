"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
import { useI18n } from "@/app/i18n/I18nProvider";
import { jsonFetcher } from "@/lib/swr";

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
        <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
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

  // Decision matrix from user:
  // - if isInfoUpdateRequested == false -> show "Update Information"
  // - if isInfoUpdateRequested == true -> check isConductAgreementSigned; if false -> show "Sign Conduct" and "View Profile"
  //   (we will show both when infoRequested && !conductSigned). If both true, default to View Profile only.

  const Btn = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className={clsx(
        compact
          ? "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90"
          : "inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow"
      )}
    >
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
      <div className={clsx("text-xs font-medium", compact ? "text-muted-foreground" : "text-muted-foreground", className)}>
        {locale === "ar" ? "تم تقديم طلب التحديث وهو قيد المعالجة" : "Your update request is submitted and in progress"}
      </div>
    );
  }

  // Case 3: Requested and status is 4 => rejected
  if (status === 4) {
    return (
      <div className={clsx("text-xs font-semibold", compact ? "text-destructive" : "text-destructive", className)}>
        {locale === "ar" ? "تم رفض طلب التحديث، يرجى التواصل مع المدرسة" : "Your update request was rejected. Please contact the school"}
      </div>
    );
  }

  // Case 4: Requested and status is 3 => approved; then check conduct
  if (status === 3) {
    if (!conductSigned) {
      return (
        <div className={clsx("flex items-center gap-2", className)}>
          <Btn href={`/child/${studentPersonId}/conduct`}>
            {locale === "ar" ? "توقيع السلوك" : "Sign Conduct"}
          </Btn>
          <Btn href={`/child/${studentPersonId}`}>
            {locale === "ar" ? "عرض الملف" : "View Profile"}
          </Btn>
        </div>
      );
    }
    // Conduct signed => only view profile
    return (
      <div className={clsx("flex items-center gap-2", className)}>
        <Btn href={`/child/${studentPersonId}`}>
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </Btn>
      </div>
    );
  }

  // Fallback
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Btn href={`/child/${studentPersonId}`}>
        {locale === "ar" ? "عرض الملف" : "View Profile"}
      </Btn>
    </div>
  );
}

export default ChildActions;

// Small status badge to visually indicate required update (used in rows/cards)
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

  const needsUpdate = data?.data && !data.data.isInfoUpdateRequested;
  if (!needsUpdate) return null;

  const label = locale === "ar" ? "تحديث مطلوب" : "Update required";
  const tooltip = locale === "ar" ? "تحتاج إلى تحديث المعلومات" : "You need to update information";

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-semibold text-red-600",
        variant === "mobile" ? "px-2 py-1 rounded-md bg-red-50 border border-red-200" : "",
        className
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 5h2v6H9V5zm0 8h2v2H9v-2z" clipRule="evenodd" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
