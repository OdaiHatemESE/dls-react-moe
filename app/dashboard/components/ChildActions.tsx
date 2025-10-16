"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
import { useI18n } from "@/app/i18n/I18nProvider";
import { jsonFetcher } from "@/lib/swr";

type UpdateInfoRow = {
  Id: number;
  studentPersonId: string;
  parentPersonId?: string | null;
  isInfoUpdateRequested?: boolean | null;
  infoUpdateRequestStatus?: string | null;
  isConductAgreementSigned?: boolean | null;
  conductAgreementStatus?: string | null;
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

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {!infoRequested && (
        <Btn href={`/child/${studentPersonId}/update-info`}>
          {locale === "ar" ? "تحديث المعلومات" : "Update Information"}
        </Btn>
      )}

      {infoRequested && !conductSigned && (
        <>
          <Btn href={`/child/${studentPersonId}/conduct`}>
            {locale === "ar" ? "توقيع السلوك" : "Sign Conduct"}
          </Btn>
          <Btn href={`/child/${studentPersonId}`}>
            {locale === "ar" ? "عرض الملف" : "View Profile"}
          </Btn>
        </>
      )}

      {infoRequested && conductSigned && (
        <Btn href={`/child/${studentPersonId}`}>
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </Btn>
      )}
    </div>
  );
}

export default ChildActions;
