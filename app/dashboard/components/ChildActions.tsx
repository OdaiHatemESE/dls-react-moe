"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
import { useI18n } from "@/app/i18n/I18nProvider";
import { jsonFetcher } from "@/lib/swr";
import type {
  ChildActionDescriptor,
  ChildActionResponse,
  ChildActionUpdateRequest,
  ChildStatusBadgeDescriptor,
} from "@/types/child-actions";

export type UpdateInfoRow = ChildActionUpdateRequest;

type Props = {
  studentPersonId: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  compact?: boolean; // when true, render smaller buttons (e.g., inside table)
  className?: string;
};

export function ChildActions({ studentPersonId, parentPersonId, studentEmirateId, compact, className }: Props) {
  const { locale } = useI18n();

  const queryString = React.useMemo(() => {
    const search = new URLSearchParams({ studentPersonId });
    if (parentPersonId) search.set("parentPersonId", parentPersonId);
    if (studentEmirateId) search.set("studentEmirateId", studentEmirateId);
    return search.toString();
  }, [studentPersonId, parentPersonId, studentEmirateId]);

  const endpoint = React.useMemo(() => `/api/parent/child-actions?${queryString}`, [queryString]);

  const { data, error, isLoading } = useSWR<ChildActionResponse>(endpoint, jsonFetcher);

  const handleDownloadPdf = React.useCallback(() => {
    const base64 = data?.updateRequest.pdfBase64;
    if (!base64) return;

    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `conduct-agreement-${studentPersonId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    }
  }, [data?.updateRequest.pdfBase64, studentPersonId]);

  if (isLoading) {
    return (
      <div className={clsx("inline-flex items-center gap-2", className)}>
        <div className="relative h-10 w-32 rounded-xl bg-muted overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    );
  }

  if (error || !data) {
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

  const actions = data.actions ?? [];
  const statusBanner = data.statusBanner;

  const renderStatusBanner = () => {
    if (!statusBanner) return null;

    const message = getStatusMessage(statusBanner, locale);

    return (
      <div
        className={clsx(
          "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
          "bg-gradient-to-r from-chart-1/10 to-chart-1/5 border border-chart-1/20",
          compact ? "text-xs" : "text-sm"
        )}
      >
        <div className="relative">
          <svg className="w-4 h-4 text-chart-1 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <span className="text-chart-1 font-semibold">{message}</span>
      </div>
    );
  };

  const renderAction = (action: ChildActionDescriptor) => {
    if (action.key === "download-conduct") {
      const reason = getActionReason(action, locale);
      return (
        <button
          key={action.key}
          onClick={handleDownloadPdf}
          disabled={!!action.disabled}
          className={buildButtonClasses("download", compact, !!action.disabled)}
          title={reason ?? undefined}
        >
          <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {getActionLabel(action, locale)}
        </button>
      );
    }

    const label = getActionLabel(action, locale);
    const reason = getActionReason(action, locale);
    const classes = buildButtonClasses(action.variant, compact, !!action.disabled);
    const icon = action.variant === "primary" ? (
      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    ) : (
      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );

    if (action.disabled || !action.href) {
      return (
        <span
          key={action.key}
          className={classes}
          aria-disabled="true"
          title={reason ?? undefined}
        >
          {icon}
          {label}
        </span>
      );
    }

    return (
      <Link
        key={action.key}
        href={action.href}
        className={classes}
        aria-disabled={action.disabled ? "true" : undefined}
        tabIndex={action.disabled ? -1 : undefined}
        title={reason ?? undefined}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div className={clsx("flex flex-wrap items-center gap-2", className)}>
      {renderStatusBanner()}
      {actions.map(renderAction)}
      {!actions.length && renderAction(
        {
          key: "view-profile",
          labelKey: "childActions.viewProfile",
          label: "View Profile",
          href: `/child/${studentPersonId}`,
          variant: "secondary",
        }
      )}
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
  const params = React.useMemo(() => {
    const search = new URLSearchParams({ studentPersonId });
    if (parentPersonId) search.set("parentPersonId", parentPersonId);
    if (studentEmirateId) search.set("studentEmirateId", studentEmirateId);
    return search.toString();
  }, [studentPersonId, parentPersonId, studentEmirateId]);

  const { data } = useSWR<ChildActionResponse>(`/api/parent/child-actions?${params}`, jsonFetcher);

  const badge = data?.badge;
  if (!badge) return null;

  const label = getBadgeLabel(badge, locale);
  const tooltip = getBadgeTooltip(badge, locale);
  const urgent = badge.tone === "urgent";

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-bold transition-all duration-200",
        variant === "mobile" ? "px-2.5 py-1.5 rounded-lg shadow-sm" : "px-2.5 py-1 rounded-lg",
        urgent
          ? "bg-gradient-to-r from-destructive/15 to-destructive/10 border border-destructive/30 text-destructive hover:shadow-md"
          : "bg-gradient-to-r from-chart-1/15 to-chart-1/10 border border-chart-1/30 text-chart-1 hover:shadow-md",
        className
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      {urgent ? (
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

function buildButtonClasses(variant: ChildActionDescriptor["variant"], compact = false, disabled = false): string {
  const base = "group inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation active:scale-95";
  const size = compact ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm";

  const palette = variant === "primary"
    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80"
    : variant === "download"
      ? "bg-gradient-to-r from-chart-2 to-chart-2/90 text-white hover:from-chart-2/90 hover:to-chart-2/80"
      : "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80";

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

  return clsx(base, size, palette, disabledStyles);
}

const ACTION_LABELS: Record<ChildActionDescriptor["key"], { en: string; ar: string }> = {
  "update-info": { en: "Update Information", ar: "تحديث المعلومات" },
  "sign-conduct": { en: "Sign Conduct", ar: "توقيع الميثاق" },
  "view-profile": { en: "View Profile", ar: "عرض الملف" },
  "download-conduct": { en: "Download Conduct", ar: "تحميل الميثاق" },
};

const STATUS_MESSAGES: Record<string, { en: string; ar: string }> = {
  "childActions.status.inProgress": {
    en: "Update request in progress...",
    ar: "طلب تحديث البيانات قيد المعالجة...",
  },
};

const REASON_LABELS: Record<string, { en: string; ar: string }> = {
  "childActions.reasons.updateDisabled": {
    en: "Updates temporarily disabled.",
    ar: "تم إيقاف التحديثات مؤقتًا.",
  },
  "childActions.reasons.pdfUnavailable": {
    en: "Conduct PDF not available yet.",
    ar: "ملف السلوك غير متوفر بعد.",
  },
};

const BADGE_LABELS: Record<string, { label: { en: string; ar: string }; tooltip: { en: string; ar: string } }> = {
  "childActions.badge.updateRequired": {
    label: { en: "Update Required", ar: "تحديث مطلوب" },
    tooltip: { en: "You need to update information", ar: "تحتاج إلى تحديث المعلومات" },
  },
  "childActions.badge.signatureRequired": {
    label: { en: "Signature Required", ar: "يتطلب توقيع" },
    tooltip: { en: "Conduct signature required", ar: "يتطلب توقيع السلوك" },
  },
};

function translate(locale: string, text: { en: string; ar: string }): string {
  return locale === "ar" ? text.ar : text.en;
}

export function getActionLabel(action: ChildActionDescriptor, locale: string): string {
  const entry = ACTION_LABELS[action.key];
  if (entry) return translate(locale, entry);
  return action.label;
}

export function getActionReason(action: ChildActionDescriptor, locale: string): string | null {
  if (action.reasonKey) {
    const entry = REASON_LABELS[action.reasonKey];
    if (entry) return translate(locale, entry);
  }
  return action.reason ?? null;
}

export function getStatusMessage(banner: NonNullable<ChildActionResponse["statusBanner"]>, locale: string): string {
  const entry = STATUS_MESSAGES[banner.messageKey];
  return entry ? translate(locale, entry) : banner.message;
}

function getBadgeLabel(badge: ChildStatusBadgeDescriptor, locale: string): string {
  const entry = BADGE_LABELS[badge.key];
  if (entry) return translate(locale, entry.label);
  return badge.label;
}

function getBadgeTooltip(badge: ChildStatusBadgeDescriptor, locale: string): string {
  const entry = BADGE_LABELS[badge.key];
  if (entry) return translate(locale, entry.tooltip);
  if (badge.tooltipKey && BADGE_LABELS[badge.tooltipKey]) {
    return translate(locale, BADGE_LABELS[badge.tooltipKey].tooltip);
  }
  return badge.tooltip ?? "";
}
