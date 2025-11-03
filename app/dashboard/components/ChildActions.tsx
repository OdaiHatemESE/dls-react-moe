"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
import {
  ChevronDown,
  ClipboardList,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Info,
  RefreshCw,
  Signature,
  UserRound,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { jsonFetcher } from "@/lib/swr";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type {
  ChildActionColor,
  ChildActionDescriptor,
  ChildActionResponse,
  ChildStatusBadgeDescriptor,
} from "@/types/child-actions";

type Props = {
  studentPersonId: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  compact?: boolean;
  className?: string;
};

export function ChildActions({ studentPersonId, parentPersonId, studentEmirateId, compact, className }: Props) {
  const { locale } = useI18n();

  const queryString = React.useMemo(() => {
    const search = new URLSearchParams({ studentPersonId });
    if (parentPersonId) search.set("parentPersonId", parentPersonId);
    if (studentEmirateId) search.set("studentEmirateId", studentEmirateId);
    search.set("includeIdh", "1");
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

  const handleAction = React.useCallback(
    (action: ChildActionDescriptor) => {
      if (action.disabled) return;

      const { type, href, handlerKey } = action.action;

      if (type === "download") {
        if (handlerKey === "conduct-pdf") {
          handleDownloadPdf();
          return;
        }

        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
        return;
      }

      if (type === "event") {
        const eventName = handlerKey ?? action.key;
        window.dispatchEvent(new CustomEvent(`child-action:${eventName}`, { detail: action }));
        return;
      }

      if (type === "href" && href) {
        window.location.href = href;
      }
    },
    [handleDownloadPdf]
  );

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const rawActions = React.useMemo(() => data?.actions ?? [], [data]);
  const visibleActions = React.useMemo(
    () => rawActions.filter((action) => !action.hidden),
    [rawActions]
  );
  const fallbackAction = React.useMemo(
    () => buildLocalFallbackAction(studentPersonId),
    [studentPersonId]
  );
  const actionsToDisplay = React.useMemo(() => {
    if (visibleActions.length) {
      return visibleActions;
    }
    return [fallbackAction];
  }, [visibleActions, fallbackAction]);

  const hasVisibleActions = visibleActions.length > 0;
  const allHiddenButConfigured = !hasVisibleActions && rawActions.length > 0;
  const showFallback = !hasVisibleActions;
  const totalActionsCount = actionsToDisplay.length;
  const statusBanner = data?.statusBanner ?? null;
  const actionsLabel = locale === "ar" ? "إجراءات الطالب" : "Student Actions";

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

  const handleActionSelect = (action: ChildActionDescriptor) => {
    if (action.hidden || action.disabled) {
      return;
    }
    handleAction(action);
    setIsMenuOpen(false);
  };

  const renderActionItem = (action: ChildActionDescriptor) => {
    const disabled = Boolean(action.disabled);
    const label = getActionLabel(action, locale);
    const description = getActionDescription(action, locale);
    const reason = getActionReason(action, locale);
    const visuals = getActionCardVisuals(action);
    const icon = renderActionIcon(action, { className: "w-4 h-4", "aria-hidden": true });

    return (
      <li key={`${action.configId ?? action.key}`}>
        <button
          type="button"
          onClick={() => handleActionSelect(action)}
          disabled={disabled}
          className={clsx(
            "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
            disabled ? "cursor-not-allowed opacity-60" : "hover:bg-muted"
          )}
        >
          <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", visuals.iconBgClass)}>
            {icon}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold leading-tight text-foreground">{label}</span>
            {description && (
              <span className="mt-1 block text-xs text-muted-foreground leading-snug line-clamp-2">{description}</span>
            )}
            {disabled && reason && (
              <span className="mt-2 block text-xs font-medium text-destructive">{reason}</span>
            )}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className={clsx("flex flex-wrap items-center gap-3", className)}>
      {renderStatusBanner()}
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            className="inline-flex items-center gap-2"
            disabled={!actionsToDisplay.length}
          >
            <span>{actionsLabel}</span>
            <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-primary/10 px-1 text-xs font-semibold text-primary">
              {totalActionsCount || actionsToDisplay.length}
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[20rem] p-0" align="start">
          <div className="flex flex-col gap-2 p-2">
            {statusBanner && (
              <div className="flex items-center gap-2 rounded-lg bg-chart-1/10 px-3 py-2 text-xs font-medium text-chart-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{getStatusMessage(statusBanner, locale)}</span>
              </div>
            )}
            <ul className="flex flex-col gap-1">
              {actionsToDisplay.map(renderActionItem)}
            </ul>
            {showFallback && (
              <p className="px-1 text-[11px] text-muted-foreground">
                {locale === "ar"
                  ? allHiddenButConfigured
                    ? "الإجراءات غير متاحة لهذا الطالب في الوقت الحالي. يظهر خيار عرض الملف فقط."
                    : "لم يتم إعداد إجراءات مخصصة بعد. يتم عرض خيار عرض الملف كإجراء افتراضي."
                  : allHiddenButConfigured
                    ? "Actions are currently unavailable for this student. Showing View Profile as the only option."
                    : "No custom actions are configured yet. Showing View Profile as the default option."}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
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
    search.set("includeIdh", "1");
    return search.toString();
  }, [studentPersonId, parentPersonId, studentEmirateId]);

  const { data } = useSWR<ChildActionResponse>(`/api/parent/child-actions?${params}`, jsonFetcher);

  const badge = data?.badge;
  
  React.useEffect(() => {
    if (badge) {
      console.log("🏷️  ChildStatusBadge Rendering:");
      console.log("   Student:", studentPersonId);
      console.log("   Badge Key:", badge.key);
      console.log("   Badge Label:", badge.label);
      console.log("   Badge Tone:", badge.tone);
      console.log("   Is Urgent:", badge.tone === "urgent");
      console.log("   Is Signature Required:", badge.key === "childActions.badge.signatureRequired");
    }
  }, [badge, studentPersonId]);
  
  if (!badge) return null;

  const label = getBadgeLabel(badge, locale);
  const tooltip = getBadgeTooltip(badge, locale);
  const urgent = badge.tone === "urgent";

  // Determine icon based on badge type
  const isSignatureRequired = badge.key === "childActions.badge.signatureRequired";
  
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
        // Red alert icon for urgent (Update Required)
        <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 5h2v6H9V5zm0 8h2v2H9v-2z" clipRule="evenodd" />
        </svg>
      ) : isSignatureRequired ? (
        // Pen/signature icon for signature required
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ) : (
        // Info/checkmark icon for other info badges
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );
}
 
type ColorPreset = {
  solid: string;
  outline: string;
  ghost: string;
  link: string;
  cardIndicator: string;
  cardAccent: string;
  cardIconBg: string;
};

const COLOR_PRESETS: Record<ChildActionColor, ColorPreset> = {
  primary: {
    solid: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80",
    outline: "border border-primary text-primary hover:bg-primary/10",
    ghost: "bg-primary/10 text-primary hover:bg-primary/15",
    link: "bg-transparent text-primary underline-offset-4 hover:underline",
    cardIndicator: "from-primary/90 to-primary/70",
    cardAccent: "border-primary/30 hover:border-primary/40",
    cardIconBg: "bg-gradient-to-br from-primary/90 to-primary/70 text-white",
  },
  secondary: {
    solid: "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80",
    outline: "border border-secondary text-secondary-foreground hover:bg-secondary/10",
    ghost: "bg-secondary/10 text-secondary-foreground hover:bg-secondary/20",
    link: "bg-transparent text-secondary-foreground underline-offset-4 hover:underline",
    cardIndicator: "from-secondary/90 to-secondary/70",
    cardAccent: "border-secondary/30 hover:border-secondary/40",
    cardIconBg: "bg-gradient-to-br from-secondary/90 to-secondary/70 text-secondary-foreground",
  },
  info: {
    solid: "bg-gradient-to-r from-chart-1 to-chart-1/90 text-white hover:from-chart-1/90 hover:to-chart-1/80",
    outline: "border border-chart-1 text-chart-1 hover:bg-chart-1/10",
    ghost: "bg-chart-1/10 text-chart-1 hover:bg-chart-1/15",
    link: "bg-transparent text-chart-1 underline-offset-4 hover:underline",
    cardIndicator: "from-chart-1 to-chart-1/80",
    cardAccent: "border-chart-1/30 hover:border-chart-1/40",
    cardIconBg: "bg-gradient-to-br from-chart-1 to-chart-1/80 text-white",
  },
  success: {
    solid: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-500/90 hover:to-emerald-600/90",
    outline: "border border-emerald-500 text-emerald-600 hover:bg-emerald-50",
    ghost: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    link: "bg-transparent text-emerald-600 underline-offset-4 hover:underline",
    cardIndicator: "from-emerald-500 to-emerald-600",
    cardAccent: "border-emerald-200 hover:border-emerald-300",
    cardIconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
  },
  warning: {
    solid: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-500/90 hover:to-amber-600/90",
    outline: "border border-amber-500 text-amber-600 hover:bg-amber-50",
    ghost: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    link: "bg-transparent text-amber-600 underline-offset-4 hover:underline",
    cardIndicator: "from-amber-500 to-amber-600",
    cardAccent: "border-amber-200 hover:border-amber-300",
    cardIconBg: "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
  },
  danger: {
    solid: "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-500/90 hover:to-rose-600/90",
    outline: "border border-rose-500 text-rose-600 hover:bg-rose-50",
    ghost: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    link: "bg-transparent text-rose-600 underline-offset-4 hover:underline",
    cardIndicator: "from-rose-500 to-rose-600",
    cardAccent: "border-rose-200 hover:border-rose-300",
    cardIconBg: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
  },
  neutral: {
    solid: "bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-600/90 hover:to-slate-700/90",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-100",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    link: "bg-transparent text-slate-700 underline-offset-4 hover:underline",
    cardIndicator: "from-slate-500 to-slate-600",
    cardAccent: "border-slate-200 hover:border-slate-300",
    cardIconBg: "bg-gradient-to-br from-slate-600 to-slate-500 text-white",
  },
};

function getColorPreset(color?: ChildActionColor | null): ColorPreset {
  if (!color) {
    return COLOR_PRESETS.primary;
  }
  return COLOR_PRESETS[color] ?? COLOR_PRESETS.primary;
}

const FALLBACK_ACTION_LABELS: Record<string, { en: string; ar: string }> = {
  "update-info": { en: "Update Information", ar: "تحديث المعلومات" },
  "sign-conduct": { en: "Sign Conduct", ar: "توقيع الميثاق" },
  "view-profile": { en: "View Profile", ar: "عرض الملف" },
  "download-conduct": { en: "Download Conduct", ar: "تحميل الميثاق" },
};

const FALLBACK_ACTION_DESCRIPTIONS: Record<string, { en: string; ar: string }> = {
  "update-info": {
    en: "Refresh contact, address, and transportation details.",
    ar: "حدِّث أرقام التواصل والعنوان وطريقة المواصلات.",
  },
  "sign-conduct": {
    en: "Review and digitally sign the school conduct charter.",
    ar: "راجع ووقع على ميثاق السلوك المدرسي رقميًا.",
  },
  "download-conduct": {
    en: "Download a copy of the signed conduct agreement.",
    ar: "حمّل نسخة من اتفاقية السلوك الموقعة.",
  },
  "view-profile": {
    en: "Review full student profile details in one place.",
    ar: "استعرض معلومات ملف الطالب كاملة في مكان واحد.",
  },
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
  const localized = getLocalizedText(action.display?.label, locale, action.label);
  if (localized) {
    return localized;
  }

  const fallback = FALLBACK_ACTION_LABELS[action.key];
  if (fallback) {
    return translate(locale, fallback);
  }

  return action.label;
}

export function getActionReason(action: ChildActionDescriptor, locale: string): string | null {
  if (action.disabledReason) {
    const localized = getLocalizedText(action.disabledReason, locale, undefined);
    if (localized) {
      return localized;
    }
  }

  if (action.reasonKey) {
    const entry = REASON_LABELS[action.reasonKey];
    if (entry) return translate(locale, entry);
  }
  return action.reason ?? null;
}

export function getActionDescription(action: ChildActionDescriptor, locale: string): string | null {
  const localized = getLocalizedText(action.display?.description, locale, action.description ?? undefined);
  if (localized) {
    return localized;
  }

  const fallback = FALLBACK_ACTION_DESCRIPTIONS[action.key];
  return fallback ? translate(locale, fallback) : action.description ?? null;
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

export function getActionCardVisuals(action: ChildActionDescriptor): {
  indicatorClass: string;
  accentClass: string;
  iconBgClass: string;
} {
  const palette = getColorPreset(action.style.color);
  return {
    indicatorClass: palette.cardIndicator,
    accentClass: palette.cardAccent,
    iconBgClass: palette.cardIconBg,
  };
}

const ICON_MAP: Record<string, LucideIcon> = {
  "edit": Edit3,
  "edit-3": Edit3,
  "signature": Signature,
  "download": Download,
  "eye": Eye,
  "file": FileText,
  "file-text": FileText,
  "link": ExternalLink,
  "clipboard": ClipboardList,
  "user": UserRound,
  "info": Info,
  "refresh": RefreshCw,
};

function getIconComponent(action: ChildActionDescriptor): LucideIcon {
  const iconKey = (action.style.icon ?? action.key).toLowerCase();
  return ICON_MAP[iconKey] ?? FileText;
}

export function renderActionIcon(action: ChildActionDescriptor, props?: LucideProps): React.ReactElement {
  const Icon = getIconComponent(action);
  const mergedProps: LucideProps = { strokeWidth: 2, ...props };
  return <Icon {...mergedProps} />;
}

function getLocalizedText(
  text: { en?: string; ar?: string } | null | undefined,
  locale: string,
  fallback?: string
): string {
  if (!text) {
    return fallback ?? "";
  }

  const value = locale === "ar" ? text.ar ?? text.en : text.en ?? text.ar;
  if (value && value.trim().length > 0) {
    return value;
  }

  return fallback ?? "";
}

function buildLocalFallbackAction(studentPersonId: string): ChildActionDescriptor {
  const label = FALLBACK_ACTION_LABELS["view-profile"];
  const description = FALLBACK_ACTION_DESCRIPTIONS["view-profile"];
  const href = `/child/${studentPersonId}`;

  return {
    key: "view-profile",
    labelKey: "childActions.viewProfile",
    label: label.en,
    description: description.en,
    href,
    variant: "secondary",
    disabled: false,
    reasonKey: null,
    reason: null,
    display: {
      label,
      description,
      shortLabel: undefined,
      labelKey: "childActions.viewProfile",
      descriptionKey: null,
    },
    style: {
      icon: "eye",
      color: "neutral",
      variant: "outline",
    },
    action: {
      type: "href",
      href,
      handlerKey: null,
      payload: null,
      downloadFileName: null,
    },
    disabledReason: null,
    order: Number.MAX_SAFE_INTEGER,
    metadata: null,
    configId: null,
  };
}
