'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { jsonFetcher } from '@/lib/swr';
import type { ChildActionDescriptor, ChildActionResponse } from '@/types/child-actions';
import {
    getActionLabel,
    getActionReason,
    getStatusMessage,
    getActionDescription,
    getActionCardVisuals,
    renderActionIcon,
} from '@/app/dashboard/components/ChildActions';

type SignConductSectionProps = {
    locale: string;
    studentId?: string;
    studentNumber?: string | null;
    academicYear?: string | null;
};

type PartnershipCharterResponse = {
    ok: boolean;
    data?: {
        attachment01?: string | null;
    } | null;
    error?: string;
};

const DEFAULT_ACADEMIC_YEAR = "2025-2026";

function translate(locale: string, copy: { en: string; ar: string }): string {
    return locale === 'ar' ? copy.ar : copy.en;
}

function SignConductSection({ locale, studentId, studentNumber, academicYear }: SignConductSectionProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);

    const query = React.useMemo(() => {
        if (!studentId) return null;
        const search = new URLSearchParams({ studentPersonId: studentId });
        search.set('includeIdh', '1');
        return `/api/parent/child-actions?${search.toString()}`;
    }, [studentId]);

    // Only fetch when sheet is open
    const { data, error, isLoading } = useSWR<ChildActionResponse>(
        isOpen ? query : null,
        jsonFetcher,
        {
            keepPreviousData: true,
        }
    );

    // Resolve student number and academic year
    const resolvedStudentNumber = React.useMemo(() => {
        const value = typeof studentNumber === "string" ? studentNumber.trim() : "";
        return value.length > 0 ? value : null;
    }, [studentNumber]);

    const resolvedAcademicYear = React.useMemo(() => {
        const value = typeof academicYear === "string" ? academicYear.trim() : "";
        return value.length > 0 ? value : DEFAULT_ACADEMIC_YEAR;
    }, [academicYear]);

    // Fetch partnership charter to check for conduct signature
    const charterEndpoint = React.useMemo(() => {
        if (!resolvedStudentNumber) return null;
        const params = new URLSearchParams({
            studentNumber: resolvedStudentNumber,
            academicyear: resolvedAcademicYear,
        });
        return `/api/parent/students-partnership-charter?${params.toString()}`;
    }, [resolvedStudentNumber, resolvedAcademicYear]);

    // Only fetch charter when sheet is open
    const {
        data: charterData,
        error: charterError,
        isLoading: isCharterLoading,
    } = useSWR<PartnershipCharterResponse>(
        isOpen && charterEndpoint ? charterEndpoint : null,
        jsonFetcher
    );

    const charterAttachment = React.useMemo(() => {
        if (!charterData?.data) return "";
        const value = charterData.data.attachment01;
        return typeof value === "string" ? value.trim() : "";
    }, [charterData]);

    const signatureOverride = React.useMemo<boolean | null>(() => {
        if (!charterEndpoint) return null;
        if (isCharterLoading) return null;
        if (charterError) return null;
        if (!charterData) return null;
        if (charterData.ok === false) return null;
        return charterAttachment.length > 0;
    }, [charterEndpoint, charterData, charterAttachment, charterError, isCharterLoading]);

    const fallbackSigned = React.useMemo(
        () => Boolean(data?.updateRequest.pdfBase64),
        [data?.updateRequest.pdfBase64]
    );

    const isConductSigned = signatureOverride ?? fallbackSigned;

    const pdfBase64 = React.useMemo(() => {
        if (charterAttachment.length > 0) {
            return charterAttachment;
        }
        return data?.updateRequest.pdfBase64 ?? null;
    }, [charterAttachment, data?.updateRequest.pdfBase64]);

    const rawActions = React.useMemo(() => data?.actions ?? [], [data]);

    // Process actions based on conduct signature status (same logic as ChildActions)
    const processedActions = React.useMemo(() => {
        if (!rawActions.length) {
            return rawActions;
        }

        return rawActions.map((action) => {
            if (action.key === "sign-conduct") {
                return {
                    ...action,
                    hidden: isConductSigned,
                };
            }

            if (action.key === "download-conduct") {
                if (!isConductSigned) {
                    return {
                        ...action,
                        hidden: true,
                    };
                }

                return {
                    ...action,
                    hidden: false,
                    disabled: false,
                    reason: null,
                    reasonKey: null,
                    disabledReason: null,
                };
            }

            return action;
        });
    }, [isConductSigned, rawActions]);

    const visibleActions = React.useMemo(
        () => processedActions.filter((action) => !action.hidden),
        [processedActions]
    );

    const actions = visibleActions;
    const statusBanner = data?.statusBanner ?? null;
    const badge = data?.badge ?? null;
    const reasons = data?.reasons ?? [];

    const handleDownloadPdf = React.useCallback(() => {
        const base64 = pdfBase64;
        if (!base64) return;

        try {
            const bytes = Uint8Array.from(window.atob(base64), (char) => char.charCodeAt(0));
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `conduct-agreement-${studentId ?? 'student'}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download conduct PDF', err);
        }
    }, [pdfBase64, studentId]);

    const handleAction = React.useCallback(
        (action: ChildActionDescriptor) => {
            if (action.disabled) return;

            const { type, href, handlerKey } = action.action;

            if (type === 'download') {
                if (handlerKey === 'conduct-pdf') {
                    handleDownloadPdf();
                    setIsOpen(false);
                    return;
                }

                if (href) {
                    window.open(href, '_blank', 'noopener,noreferrer');
                    setIsOpen(false);
                }
                return;
            }

            if (type === 'event') {
                const eventName = handlerKey ?? action.key;
                window.dispatchEvent(new CustomEvent(`child-action:${eventName}`, { detail: action }));
                setIsOpen(false);
                return;
            }

            if (type === 'href' && href) {
                router.push(href);
                setIsOpen(false);
            }
        },
        [handleDownloadPdf, router],
    );

    const renderAction = (action: ChildActionDescriptor) => {
        const visuals = getActionCardVisuals(action);
        const label = getActionLabel(action, locale);
        const description = getActionDescription(action, locale) ?? translate(locale, {
            en: 'Proceed with this action.',
            ar: 'تابع هذا الإجراء.',
        });
        const reason = getActionReason(action, locale);
        const disabled = Boolean(action.disabled);
        const arrowDirection = locale === 'ar' ? 'rotate-180' : '';

        return (
            <div
                key={action.key}
                className={clsx(
                    'group relative overflow-hidden rounded-xl border bg-white transition-all duration-300',
                    visuals.accentClass,
                    'hover:-translate-y-1 hover:shadow-lg'
                )}
            >
                <Button
                    onClick={() => handleAction(action)}
                    disabled={disabled}
                    className={clsx(
                        'relative w-full justify-start gap-4 h-auto p-6 bg-transparent text-gray-900 border-0 shadow-none',
                        disabled && 'opacity-60 cursor-not-allowed'
                    )}
                    variant="ghost"
                >
                    <div
                        className={clsx(
                            'p-3 rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110',
                            visuals.iconBgClass,
                            disabled && 'grayscale'
                        )}
                    >
                        {renderActionIcon(action, { className: 'w-6 h-6 text-white', 'aria-hidden': true })}
                    </div>
                    <div className={clsx('flex-1', locale === 'ar' ? 'text-right' : 'text-left')}>
                        <div
                            className={clsx(
                                locale === 'ar' ? 'font-semibold text-base' : 'font-bold text-lg',
                                'text-gray-900 transition-colors',
                                disabled ? 'text-muted-foreground' : 'group-hover:text-primary'
                            )}
                        >
                            {label}
                        </div>
                        <p
                            className={clsx(
                                locale === 'ar' ? 'text-sm' : 'text-base',
                                'mt-1 transition-colors text-gray-600',
                                disabled ? 'text-muted-foreground' : 'group-hover:text-primary/80'
                            )}
                        >
                            {description}
                        </p>
                        {disabled && reason && (
                            <p className="mt-2 text-xs text-destructive font-medium">{reason}</p>
                        )}
                    </div>
                    <div className="flex items-center">
                        <div
                            className={clsx(
                                'w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-all duration-300',
                                disabled ? 'bg-muted' : 'group-hover:bg-primary/10'
                            )}
                        >
                            <svg
                                className={clsx('w-4 h-4 text-primary transition-transform group-hover:translate-x-1', arrowDirection)}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Button>
            </div>
        );
    };

    const statusMessage = statusBanner ? getStatusMessage(statusBanner, locale) : null;

    const actionCount = visibleActions.length;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className={clsx(
                    "relative w-full px-5 py-3 md:py-4 rounded-xl shadow-lg transition-all duration-300",
                    "bg-white hover:bg-white/95",
                    "text-primary font-bold text-sm md:text-base",
                    "hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]",
                    "group overflow-hidden"
                )}>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                    
                    {/* Content */}
                    <div className="relative flex items-center justify-center gap-3">
                        <span className="font-bold">
                            {locale === 'ar' ? 'عرض الإجراءات المتاحة' : 'View Available Actions'}
                        </span>
                        
                        {/* Action count badge */}
                        {!isLoading && actionCount > 0 && (
                            <Badge className="bg-primary text-white border-0 text-xs px-2 py-0.5 font-bold">
                                {actionCount}
                            </Badge>
                        )}
                        
                        <svg className={clsx(
                            'w-5 h-5 transition-transform duration-300 group-hover:translate-x-1',
                            locale === 'ar' && 'rotate-180 group-hover:-translate-x-1'
                        )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                </Button>
            </SheetTrigger>

                <SheetContent className={clsx('sm:max-w-lg bg-white', locale === 'ar' && 'direction-rtl')}>
                    <SheetHeader className="mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary rounded-xl shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-1">
                                <SheetTitle className={clsx(locale === 'ar' ? 'text-right font-semibold text-xl' : 'text-left text-2xl font-bold', 'text-gray-900')}>
                                    {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                                </SheetTitle>
                            </div>
                        </div>
                        <SheetDescription className={clsx(locale === 'ar' ? 'text-right text-base' : 'text-left text-lg', 'text-gray-600 leading-relaxed')}>
                            {locale === 'ar'
                                ? 'اختر الإجراء المناسب من الخيارات المتاحة أدناه للمتابعة'
                                : 'Select the appropriate action from the available options below to continue'}
                        </SheetDescription>
                        {isLoading && (
                            <div className="mt-4 bg-muted/40 border border-border/60 rounded-lg px-4 py-3 text-sm text-muted-foreground">
                                {locale === 'ar' ? 'جاري تحميل الإجراءات...' : 'Loading available actions...'}
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-lg px-4 py-3 text-sm">
                                {locale === 'ar' ? 'تعذر تحميل الإجراءات. حاول مرة أخرى لاحقًا.' : 'Could not load actions. Please try again later.'}
                            </div>
                        )}
                        {statusMessage && (
                            <div className="mt-4 inline-flex items-center gap-2 bg-chart-1/10 text-chart-1 border border-chart-1/30 rounded-lg px-3 py-2 text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{statusMessage}</span>
                            </div>
                        )}
                    </SheetHeader>

                    <div className="space-y-3">
                        {isLoading && !data ? (
                            // Loading skeleton
                            <>
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={`skeleton-${index}`}
                                        className="group relative overflow-hidden rounded-xl border border-border/60 bg-white"
                                    >
                                        <div className="relative w-full h-auto p-6 flex gap-4 items-start">
                                            {/* Icon skeleton */}
                                            <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-muted via-muted/80 to-muted/60 overflow-hidden flex-shrink-0">
                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                            </div>
                                            
                                            {/* Content skeleton */}
                                            <div className="flex-1 space-y-3">
                                                <div className="relative h-5 w-3/4 rounded-lg bg-muted overflow-hidden">
                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                                </div>
                                                <div className="relative h-4 w-full rounded-lg bg-muted/70 overflow-hidden">
                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                                </div>
                                            </div>
                                            
                                            {/* Arrow skeleton */}
                                            <div className="relative w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : actions.length > 0 ? (
                            actions.map(renderAction)
                        ) : !isLoading ? (
                            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                                {locale === 'ar' ? 'لا توجد إجراءات متاحة حالياً.' : 'No actions are currently available.'}
                            </div>
                        ) : null}
                    </div>

                    {reasons.length > 0 && (
                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <p className="font-semibold mb-1">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                            <ul
                                className={clsx(
                                    'list-disc list-inside space-y-1 text-left',
                                    locale === 'ar' && 'text-right'
                                )}
                            >
                                {reasons.map((reason) => (
                                    <li key={reason}>{reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
                        {locale === 'ar'
                            ? 'في حالة وجود أي استفسارات، يرجى التواصل مع إدارة المدرسة.'
                            : 'For any questions or assistance, please contact the school administration.'}
                    </div>
                </SheetContent>
            </Sheet>
    );
}

export default SignConductSection;
