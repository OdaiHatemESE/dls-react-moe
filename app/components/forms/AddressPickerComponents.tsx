"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Re-export AddressValue type for use in components
export type AddressValue = {
  emirateId?: number;
  areaId?: number;
  streetName?: string;
  houseNumber?: string;
  regionId?: number;
  zoneId?: number;
  plotId?: number;
  longitude?: number | null;
  latitude?: number | null;
  mainPlotId?: string | null;
  premisesPlotId?: string | null;
  emirateNameEn?: string | null;
  emirateNameAr?: string | null;
  areaNameEn?: string | null;
  areaNameAr?: string | null;
  regionNameEn?: string | null;
  regionNameAr?: string | null;
  zoneNameEn?: string | null;
  zoneNameAr?: string | null;
  fullAddressEn?: string | null;
  fullAddressAr?: string | null;
};

type Area = {
  Id: number;
  TitleAr: string;
  TitleEn: string;
  IsActive: boolean;
  ZoneId: number;
  ManhalCode: string | null;
};

type Region = {
  Id: number;
  TitleAr: string;
  TitleEn: string;
  IsActive: boolean;
  EmirateId: number;
};

type Zone = {
  Id: number;
  TitleAr: string;
  TitleEn: string;
  IsActive: boolean;
  RegionId: number;
};

// ============================================
// Dubai & Northern Emirates Layout
// ============================================
type DubaiNorthernEmiratesFieldsProps = {
  local: AddressValue;
  emit: (updates: Partial<AddressValue>) => void;
  disabled?: boolean;
  touched: { [K in keyof AddressValue]?: boolean };
  setTouched: React.Dispatch<React.SetStateAction<{ [K in keyof AddressValue]?: boolean }>>;
  areas: Area[];
  areasLoading: boolean;
  emiratesLoading: boolean;
  areaError: boolean;
  streetError: boolean;
  houseError: boolean;
  l: {
    area: string;
    streetName: string;
    houseNumber: string;
    requiredField: string;
  };
  req: {
    area: boolean;
    streetName: boolean;
    houseNumber: boolean;
  };
  isRTL: boolean;
  locale: string;
  t: {
    pickLocation: {
      loading: string;
      noAreas: string;
    };
  };
};

export function DubaiNorthernEmiratesFields({
  local,
  emit,
  disabled,
  touched,
  setTouched,
  areas,
  areasLoading,
  emiratesLoading,
  areaError,
  streetError,
  houseError,
  l,
  req,
  isRTL,
  locale,
  t,
}: DubaiNorthernEmiratesFieldsProps) {
  return (
    <div id="DubaiNorthEmirate" className="space-y-5 animate-in fade-in-50 duration-300">
      {/* Area select (depends on emirate) */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {l.area}
          {req.area && <span className="text-destructive">*</span>}
        </label>
        <Select
          dir={isRTL ? "rtl" : "ltr"}
          disabled={
            disabled ||
            local.emirateId === undefined ||
            local.emirateId === null ||
            emiratesLoading ||
            areasLoading
          }
          value={
            local.areaId !== undefined && local.areaId !== null
              ? String(local.areaId)
              : undefined
          }
          onValueChange={(v) => emit({ areaId: Number(v) })}
          onOpenChange={(o) => {
            if (!o) setTouched((t) => ({ ...t, areaId: true }));
          }}
        >
          <SelectTrigger
            className={cn(
              "h-12 rounded-xl border-2 bg-background shadow-sm transition-all duration-200",
              "hover:border-primary/50 hover:shadow-md focus:border-primary focus:ring-4 focus:ring-primary/10",
              "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
              areasLoading && "animate-pulse",
              areaError &&
                "border-destructive/50 focus:border-destructive focus:ring-destructive/10",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <SelectValue
              placeholder={areasLoading ? t.pickLocation.loading : l.area}
            />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
            {areas.length === 0 && !areasLoading && (
              <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                {t.pickLocation.noAreas}
              </div>
            )}
            {areas.map((a) => (
              <SelectItem
                key={a.Id}
                value={String(a.Id)}
                className={cn(
                  "cursor-pointer hover:bg-primary/10 focus:bg-primary/10 rounded-lg my-0.5 transition-colors",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                {locale === "ar" ? a.TitleAr : a.TitleEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {areaError && (
          <p className="text-xs text-destructive flex items-center gap-1.5 animate-in slide-in-from-top-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {l.requiredField}
          </p>
        )}
      </div>

      {/* Street name */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {l.streetName}
          {req.streetName && <span className="text-destructive">*</span>}
        </label>
        <Input
          disabled={disabled}
          value={local.streetName ?? ""}
          onChange={(e) => emit({ streetName: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, streetName: true }))}
          className={cn(
            "h-12 rounded-xl border-2 bg-background shadow-sm transition-all duration-200",
            "hover:border-primary/50 hover:shadow-md focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
            "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
            streetError &&
              "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/10"
          )}
          placeholder={l.streetName}
        />
        {streetError && (
          <p className="text-xs text-destructive flex items-center gap-1.5 animate-in slide-in-from-top-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {l.requiredField}
          </p>
        )}
      </div>

      {/* House number */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {l.houseNumber}
          {req.houseNumber && <span className="text-destructive">*</span>}
        </label>
        <Input
          disabled={disabled}
          value={local.houseNumber ?? ""}
          onChange={(e) => emit({ houseNumber: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, houseNumber: true }))}
          className={cn(
            "h-12 rounded-xl border-2 bg-background shadow-sm transition-all duration-200",
            "hover:border-primary/50 hover:shadow-md focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
            "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
            houseError &&
              "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/10"
          )}
          placeholder={l.houseNumber}
        />
        {houseError && (
          <p className="text-xs text-destructive flex items-center gap-1.5 animate-in slide-in-from-top-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {l.requiredField}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Abu Dhabi Emirate Layout (Map-driven)
// ============================================
type AbuDhabiEmirateFieldsProps = {
  local: AddressValue;
  emit: (updates: Partial<AddressValue>) => void;
  disabled?: boolean;
  hasMapSelection: boolean;
  setIsMapDialogOpen: (open: boolean) => void;
  pendingSelection: any;
  regions: Region[];
  zones: Zone[];
  abuDhabiAreas: Area[];
  regionsLoading: boolean;
  zonesLoading: boolean;
  abuDhabiAreasLoading: boolean;
  lockAbuDhabiFields: boolean;
  touched: { [K in keyof AddressValue]?: boolean };
  setTouched: React.Dispatch<React.SetStateAction<{ [K in keyof AddressValue]?: boolean }>>;
  regionPlaceholder: string;
  zonePlaceholder: string;
  areaPlaceholder: string;
  isRTL: boolean;
  locale: string;
  t: {
    pickLocation: {
      loading: string;
    };
  };
};

export function AbuDhabiEmirateFields({
  local,
  disabled,
  hasMapSelection,
  setIsMapDialogOpen,
  pendingSelection,
  lockAbuDhabiFields,
  isRTL,
  locale,
}: AbuDhabiEmirateFieldsProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Abu Dhabi Section Header */}
      <div className="flex items-center gap-2 pt-4 pb-2 border-t border-border/50">
        <svg className="w-5 h-5 text-aegreen-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h4 className="text-sm font-semibold text-foreground">
          {locale === "ar" ? "تفاصيل إمارة أبوظبي" : "Abu Dhabi Details"}
        </h4>
      </div>

      {/* Map Selection Card */}
      <div className="bg-gradient-to-br from-aegreen-50 to-blue-50 dark:from-aegreen-950/20 dark:to-blue-950/20 rounded-xl p-5 border-2 border-aegreen-200/50 dark:border-aegreen-800/50 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Map Selection Button */}
          <Button
            type="button"
            onClick={() => setIsMapDialogOpen(true)}
            className={cn(
              "h-14 w-full rounded-xl font-medium shadow-sm transition-all duration-200",
              hasMapSelection 
                ? "bg-aegreen-600/20 text-aegreen-700 dark:text-aegreen-400 border-2 border-aegreen-600/50 hover:bg-aegreen-600/30 hover:border-aegreen-600/60" 
                : "bg-aegreen-600 text-white hover:bg-aegreen-700",
              "active:scale-[0.98]",
              "focus:outline-none focus:ring-4 focus:ring-aegreen-500/30",
              "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
              "flex items-center justify-center gap-3"
            )}
            disabled={disabled}
          >
            {hasMapSelection ? (
              <>
                <svg className="w-6 h-6 animate-in zoom-in duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-base font-semibold">
                  {locale === "ar" ? "تم اختيار الموقع من الخريطة" : "Location Selected from Map"}
                </span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-base font-semibold">
                  {locale === "ar" ? "اختر من الخريطة (Onwani)" : "Select From Map (Onwani)"}
                </span>
              </>
            )}
          </Button>

          {/* Info Text */}
          <p className="text-center text-xs text-aegreen-700 dark:text-aegreen-400 flex items-center justify-center gap-1.5 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {locale === "ar" ? "سيتم ملء جميع البيانات تلقائياً من الخريطة" : "All address data will be automatically filled from the map"}
          </p>
        </div>
      </div>

      {/* Read-only Address Display (when map selection exists) */}
      {hasMapSelection && (local.regionNameEn || local.zoneNameEn || local.areaNameEn || local.streetName || local.houseNumber) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <svg className="w-5 h-5 text-aegreen-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h5 className="text-sm font-bold text-foreground">
              {locale === "ar" ? "العنوان المحدد" : "Selected Address"}
            </h5>
            <Badge variant="outline" className="ml-auto bg-aegreen-50 dark:bg-aegreen-950/30 text-aegreen-700 dark:text-aegreen-400 border-aegreen-300 dark:border-aegreen-700">
              {locale === "ar" ? "من الخريطة" : "From Map"}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Full Address from Onwani (if available) */}
            {(local.fullAddressEn || local.fullAddressAr) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {locale === "ar" ? "العنوان الكامل من أونواني" : "Full Address from Onwani"}
                </p>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
                  {locale === "ar" ? local.fullAddressAr || local.fullAddressEn : local.fullAddressEn || local.fullAddressAr}
                </p>
              </div>
            )}

            {/* Plot ID - Full width prominent display */}
            {local.mainPlotId && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "رقم القطعة" : "PLOT ID"}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {local.mainPlotId}
                </p>
              </div>
            )}

            {/* Three-column layout for City, Region, Sector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City - maps to regionNameEn */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "المدينة" : "City"}*
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {locale === "ar" ? local.regionNameAr || local.regionNameEn || "" : local.regionNameEn || ""}
                </p>
              </div>

              {/* Region - maps to zoneNameEn */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "المنطقة" : "Region"}*
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {locale === "ar" ? local.zoneNameAr || local.zoneNameEn || "" : local.zoneNameEn || ""}
                </p>
              </div>

              {/* Sector - maps to areaNameEn */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "القطاع" : "Sector"}*
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {locale === "ar" ? local.areaNameAr || local.areaNameEn || "" : local.areaNameEn || ""}
                </p>
              </div>
            </div>

            {/* Two-column layout for Road Number and Plot Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Road Number */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "رقم الطريق" : "Road Number"}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {local.streetName || ""}
                </p>
              </div>

              {/* Plot Number */}
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "رقم القطعة" : "Plot Number"}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {local.houseNumber || ""}
                </p>
              </div>
            </div>

            {/* Coordinates - Two column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "خط العرض" : "Latitude"}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {local.latitude || ""}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                  {locale === "ar" ? "خط الطول" : "Longitude"}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {local.longitude || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Action hint */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {locale === "ar" ? "لتعديل العنوان، اضغط على زر الخريطة أعلاه" : "To modify address, click the map button above"}
            </p>
          </div>
        </div>
      )}

      {/* Placeholder when no selection */}
      {!hasMapSelection && (
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {locale === "ar" ? "لم يتم اختيار موقع بعد" : "No Location Selected Yet"}
          </h6>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {locale === "ar" ? "اضغط على زر الخريطة لتحديد موقعك" : "Click the map button to select your location"}
          </p>
        </div>
      )}
    </div>
  );
}
