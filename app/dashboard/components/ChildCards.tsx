"use client";

import React from "react";
import { useChildren } from "@/lib/hooks/useChildren";
import type { Person } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import ChildActions, { ChildStatusBadge } from "./ChildActions";

// Enhanced helper components for clean UI with theme-aware colors - Mobile Optimized
const InfoItem = ({ label, value, icon, locale }: { label: string; value: string; icon?: React.ReactNode; locale?: string }) => (
  <div className={clsx(
    "group/info flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300",
    "bg-gradient-to-r from-muted/60 to-muted/40 backdrop-blur-sm border border-border/50",
    "hover:from-primary/5 hover:to-primary/10 hover:border-primary/20 hover:shadow-md",
    "touch-manipulation active:scale-[0.98]",
    locale === 'ar' ? 'flex-row-reverse' : ''
  )}>
    <div className={clsx(
      "flex items-center gap-2.5",
      locale === 'ar' ? 'flex-row-reverse' : ''
    )}>
      {icon && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/info:bg-primary/20 transition-colors">
          {icon}
        </div>
      )}
      <span className={clsx(
        "text-muted-foreground font-medium text-sm group-hover/info:text-foreground transition-colors",
        locale === 'ar' && 'font-semibold'
      )}>
        {label}
      </span>
    </div>
    <span className={clsx(
      "font-bold text-sm text-foreground",
      locale === 'ar' && 'text-base'
    )}>
      {value}
    </span>
  </div>
);

export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();

  // normalization is handled by useChildren
  const eid = status === "authenticated" ? (session?.user?.emiratesId || '') : undefined;
  const { children, error, isLoading } = useChildren(eid);
  console.log("Children:", children, error, isLoading);
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
      {/* Gender */}
      <td className="px-6 py-6">
        <div className="relative h-7 w-24 rounded-full bg-muted overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
              <Card key={`mobile-skeleton-${i}`} className="relative overflow-hidden border-border/50 shadow-lg">
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
          <Card className="relative overflow-hidden border-destructive/20 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-destructive/10" />
            <div className="relative p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-destructive/20 to-destructive/30 rounded-3xl flex items-center justify-center shadow-lg ring-4 ring-destructive/10">
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
        {(children ?? []).map((child: Person) => {
          const displayName = locale === 'ar'
            ? [child.givenName, child.middleName, child.familyName].filter(Boolean).join(' ')
            : [child.metadata?.englishFirstName, child.metadata?.englishSecondName, child.metadata?.englishThirdName, child.metadata?.englishFamilyName].filter(Boolean).join(' ');
          const gender = child.metadata?.gender || '';

          const genderLabel = (() => {
            const g = gender?.toLowerCase();
            if (g === 'm' || g === 'male' || g === 'ذكر') {
              return t.student?.male || (locale === 'ar' ? 'ذكر' : 'Male');
            } else if (g === 'f' || g === 'female' || g === 'أنثى') {
              return t.student?.female || (locale === 'ar' ? 'أنثى' : 'Female');
            }
            return gender || '—';
          })();

          return (
            <Card 
              key={child.sourcedId} 
              className={clsx(
                "group relative overflow-hidden transition-all duration-300",
                "border-border/60 shadow-lg hover:shadow-2xl",
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
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-card group-hover:scale-105 transition-transform duration-300">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Active status indicator */}
                    {child.status === 'active' && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-chart-2 rounded-full border-3 border-card flex items-center justify-center shadow-lg">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate mb-2 group-hover:text-primary transition-colors">
                      {displayName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-muted/50 border-border/70">
                        <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        {child.sourcedId.slice(-6)}
                      </Badge>
                      <ChildStatusBadge studentPersonId={child.sourcedId} variant="mobile" />
                    </div>
                  </div>
                </div>

                {/* Student Info Section */}
                <div className="space-y-3 mb-5">
                  <InfoItem
                    label={t.student?.gender || (locale === 'ar' ? 'الجنس' : 'Gender')}
                    value={genderLabel}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    locale={locale}
                  />
                </div>

                {/* Actions Section */}
                <div className="pt-4 border-t border-border/50">
                  <ChildActions studentPersonId={child.sourcedId} className="w-full" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table Layout (Hidden on Mobile) */}
      <div className="hidden lg:block relative overflow-hidden bg-card rounded-2xl shadow-xl border border-border/50">
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
                  <div className={clsx("flex items-center gap-3", locale === 'ar' && 'flex-row-reverse')}>
                    <div className="p-2 bg-primary/15 rounded-xl shadow-sm">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span>{locale === 'ar' ? 'الطالب' : 'Student'}</span>
                  </div>
                </th>
                <th className={clsx(
                  "px-8 py-5 text-left uppercase tracking-wide",
                  locale === 'ar' ? 'text-right' : '',
                  "text-sm font-bold text-foreground"
                )}>
                  <div className={clsx("flex items-center gap-3", locale === 'ar' && 'flex-row-reverse')}>
                    <div className="p-2 bg-chart-2/20 rounded-xl shadow-sm">
                      <svg className="w-5 h-5 text-chart-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" />
                      </svg>
                    </div>
                    <span>{t.student?.gender || (locale === 'ar' ? 'الجنس' : 'Gender')}</span>
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
              {(children ?? []).map((child: Person) => {
                const displayName = locale === 'ar'
                  ? [child.givenName, child.middleName, child.familyName].filter(Boolean).join(' ')
                  : [child.metadata?.englishFirstName, child.metadata?.englishSecondName, child.metadata?.englishThirdName, child.metadata?.englishFamilyName].filter(Boolean).join(' ');
                const gender = child.metadata?.gender || '';

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
                  <tr 
                    key={child.sourcedId}
                    className="group border-b border-border/40 hover:bg-gradient-to-r hover:from-primary/8 hover:via-primary/5 hover:to-transparent transition-all duration-300"
                  >
                    {/* Enhanced Student Name & Avatar */}
                    <td className="px-8 py-6">
                      <div className={clsx("flex items-center gap-5", locale === 'ar' && 'flex-row-reverse')}>
                        <div className="relative flex-shrink-0 group/avatar">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg group-hover/avatar:shadow-2xl transition-all duration-300 group-hover:scale-110 ring-2 ring-card">
                            <span className="text-2xl font-bold text-primary-foreground">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {/* Active status indicator */}
                          {child.status === 'active' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-chart-2 rounded-full border-3 border-card flex items-center justify-center shadow-lg">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={clsx(
                            "font-bold text-foreground group-hover:text-primary transition-colors mb-2",
                            locale === 'ar' ? 'text-base' : 'text-lg'
                          )}>
                            {displayName}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium bg-muted/50 border-border/70">
                              <svg className={clsx("w-3 h-3", locale === 'ar' ? 'ml-1' : 'mr-1')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              {child.sourcedId?.slice(-6) || '—'}
                            </Badge>
                            <ChildStatusBadge studentPersonId={child.sourcedId} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Enhanced Gender Badge */}
                    <td className="px-8 py-6">
                      <Badge 
                        className={clsx(
                          "text-sm font-semibold px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md",
                          genderLabel.toLowerCase().includes('male') || genderLabel.includes('ذكر')
                            ? 'bg-primary/15 border-primary/30 text-primary hover:bg-primary/25' 
                            : 'bg-secondary/15 border-secondary/30 text-secondary-foreground hover:bg-secondary/25'
                        )}
                      >
                        <svg className={clsx("w-3.5 h-3.5", locale === 'ar' ? 'ml-1.5' : 'mr-1.5')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {genderLabel}
                      </Badge>
                    </td>

                    {/* Enhanced Actions with Status */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                        <ChildActions studentPersonId={child.sourcedId} compact />
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
