"use client";

import * as React from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/app/i18n/I18nProvider";

type Emirate = {
  Id: number;
  TitleAr: string;
  TitleEn: string;
  IsActive: boolean;
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

type Plot = {
  id: number;
  titleAr: string | null;
  titleEn: string | null;
  premisesPlotId: string | null;
};

export type AddressValue = {
  emirateId?: number | null;
  areaId?: number | null;
  streetName?: string;
  houseNumber?: string;
  // Abu Dhabi specific fields
  regionId?: number | null;
  zoneId?: number | null;
  plotId?: number | null;
};

export type AddressPickerProps = {
  value?: AddressValue;
  onChange?: (next: AddressValue) => void;
  disabled?: boolean;
  className?: string;
  isAbuDhabi?: boolean; // toggles the areas API query style
  // When isAbuDhabi = true, Areas API expects ZoneId instead of EmirateId.
  // By default we reuse emirateId as the source. If your UI captures ZoneId separately,
  // provide it here and it will be used for the query.
  abuDhabiZoneIdOverride?: number;
  gradeCode?: string; // passthrough to API (future use)
  genderCode?: string; // passthrough to API (future use)
  labels?: Partial<{
    emirate: string;
    area: string;
    streetName: string;
    houseNumber: string;
    requiredField: string;
  }>;
  required?: Partial<{
    emirate: boolean;
    area: boolean;
    streetName: boolean;
    houseNumber: boolean;
  }>;
  layout?: "grid" | "stack";
};

function useEmirates() {
  return useSWR<{ data: Emirate[] }>("/api/db/emirates", jsonFetcher);
}

function useRegions(emirateId?: number | null) {
  const key = React.useMemo(() => {
    if (!emirateId) return null;
    return `/api/db/regions?emirateId=${emirateId}`;
  }, [emirateId]);
  return useSWR<{ data: Region[] }>(key, jsonFetcher);
}

function useZones(regionId?: number | null) {
  const key = React.useMemo(() => {
    if (!regionId) return null;
    return `/api/db/zones?regionId=${regionId}`;
  }, [regionId]);
  return useSWR<{ data: Zone[] }>(key, jsonFetcher);
}

function usePlots(filter?: string) {
  const key = React.useMemo(() => {
    if (!filter || filter.trim() === "") return null;
    return `/api/db/plots?filter=${encodeURIComponent(filter)}`;
  }, [filter]);
  return useSWR<{ data: Plot[] }>(key, jsonFetcher);
}

type AreasMeta = {
  zoneId: number;
  isAbuDhabi: boolean;
  gradeCode: string | null;
  genderCode: string | null;
  count: number;
};

function useAreas(params: {
  emirateId?: number | null;
  isAbuDhabi?: boolean;
  zoneIdOverride?: number | null;
  gradeCode?: string;
  genderCode?: string;
}) {
  const {
    emirateId,
    isAbuDhabi = false,
    zoneIdOverride,
    gradeCode,
    genderCode,
  } = params;
  const key = React.useMemo(() => {
    const idToUse = isAbuDhabi ? zoneIdOverride ?? emirateId : emirateId;
    if (!idToUse) return null;
    const sp = new URLSearchParams();
    // API expects zoneId, but when not AbuDhabi it treats it as EmirateId via join
    sp.set("zoneId", String(idToUse));
    if (isAbuDhabi) sp.set("isAbuDhabi", "1");
    if (gradeCode) sp.set("gradeCode", gradeCode);
    if (genderCode) sp.set("genderCode", genderCode);
    return `/api/db/areas?${sp.toString()}`;
  }, [emirateId, zoneIdOverride, isAbuDhabi, gradeCode, genderCode]);

  return useSWR<{ data: Area[]; meta: AreasMeta }>(key, jsonFetcher);
}

export function AddressPicker(props: AddressPickerProps) {
  const {
    value,
    onChange,
    disabled,
    className,
    isAbuDhabi = false,
    gradeCode,
    genderCode,
    labels,
    required,
    layout = "grid",
  } = props;

  const { locale, t } = useI18n();

  const [local, setLocal] = React.useState<AddressValue>(() => ({
    emirateId: value?.emirateId ?? undefined,
    areaId: value?.areaId ?? undefined,
    streetName: value?.streetName ?? "",
    houseNumber: value?.houseNumber ?? "",
    regionId: value?.regionId ?? undefined,
    zoneId: value?.zoneId ?? undefined,
    plotId: value?.plotId ?? undefined,
  }));

  // keep in sync with external value
  React.useEffect(() => {
    setLocal((prev) => ({
      emirateId: value?.emirateId ?? prev.emirateId,
      areaId:
        value?.areaId ??
        (value?.emirateId !== prev.emirateId ? undefined : prev.areaId),
      streetName: value?.streetName ?? prev.streetName,
      houseNumber: value?.houseNumber ?? prev.houseNumber,
      regionId: value?.regionId ?? prev.regionId,
      zoneId: value?.zoneId ?? prev.zoneId,
      plotId: value?.plotId ?? prev.plotId,
    }));
  }, [value?.emirateId, value?.areaId, value?.streetName, value?.houseNumber, value?.regionId, value?.zoneId, value?.plotId]);

  const emit = React.useCallback(
    (next: Partial<AddressValue>) => {
      const merged = { ...local, ...next };
      setLocal(merged);
      onChange?.(merged);
    },
    [local, onChange]
  );

  const { data: emiratesData, isLoading: emiratesLoading } = useEmirates();
  // Flatten emirates list early so we can detect Abu Dhabi before areas fetch
  const emirates = React.useMemo(
    () => emiratesData?.data ?? [],
    [emiratesData]
  );

  // Detect if the currently selected emirate is Abu Dhabi (EN/AR tolerant)
  const selectedEmirate = React.useMemo(
    () => emirates.find((e) => e.Id === (local.emirateId ?? -1)),
    [emirates, local.emirateId]
  );
  const isAbuDhabiSelected = React.useMemo(() => {
    if (!selectedEmirate) return false;
    const en = (selectedEmirate.TitleEn || "")
      .toLowerCase()
      .replace(/\s+/g, "");
    const ar = (selectedEmirate.TitleAr || "").replace(/\s+/g, "");
    // Normalize Arabic (remove tatweel U+0640 and punctuation like ؟ )
    const arNorm = ar.replace(/[\u0640\u061F]/g, "");
    const abuDhabiArForms = [
      "أبوظبي",
      "ابوظبي",
      "أبوظبي",
      "ابو ظبي".replace(/\s+/g, ""),
      "أبو ظبي".replace(/\s+/g, ""),
    ];
    return (
      en.includes("abudhabi") || abuDhabiArForms.some((f) => arNorm.includes(f))
    );
  }, [selectedEmirate]);

  // When Abu Dhabi is selected, clear dependent fields since a different picker is used elsewhere
  React.useEffect(() => {
    if (!isAbuDhabiSelected) return;
    const needsClear = !!(
      local.areaId ||
      local.streetName ||
      local.houseNumber
    );
    if (needsClear) {
      emit({
        areaId: undefined,
        streetName: undefined,
        houseNumber: undefined,
      });
    }
    // Also reset touched flags for hidden fields to avoid showing errors upon switch-back
    setTouched((t) => ({
      ...t,
      areaId: false,
      streetName: false,
      houseNumber: false,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAbuDhabiSelected]);

  // Fetch Abu Dhabi hierarchical data
  const { data: regionsData, isLoading: regionsLoading } = useRegions(
    isAbuDhabiSelected ? local.emirateId : null
  );
  const regions = regionsData?.data ?? [];

  const { data: zonesData, isLoading: zonesLoading } = useZones(
    isAbuDhabiSelected ? local.regionId : null
  );
  const zones = zonesData?.data ?? [];

  // For Abu Dhabi areas, we fetch by zoneId (not emirateId)
  const { data: abuDhabiAreasData, isLoading: abuDhabiAreasLoading } = useAreas({
    emirateId: isAbuDhabiSelected ? local.zoneId : null,
    isAbuDhabi: true,
    zoneIdOverride: local.zoneId ?? null,
    gradeCode,
    genderCode,
  });

  // Skip areas fetching entirely when Abu Dhabi emirate is selected
  const { data: areasData, isLoading: areasLoading } = useAreas({
    emirateId: isAbuDhabiSelected ? undefined : local.emirateId ?? undefined,
    isAbuDhabi,
    zoneIdOverride: props.abuDhabiZoneIdOverride ?? null,
    gradeCode,
    genderCode,
  });

  const areas = areasData?.data ?? [];
  console.log("Areas data:", areas);

  const [touched, setTouched] = React.useState<{
    [K in keyof AddressValue]?: boolean;
  }>({});

  const l = {
    emirate: labels?.emirate ?? t.pickLocation.emirate,
    area: labels?.area ?? t.pickLocation.area,
    streetName: labels?.streetName ?? t.pickLocation.streetName,
    houseNumber: labels?.houseNumber ?? t.pickLocation.houseNumber,
    requiredField: labels?.requiredField ?? t.pickLocation.requiredField,
  };

  const req = {
    emirate: !!required?.emirate,
    area: !!required?.area,
    streetName: !!required?.streetName,
    houseNumber: !!required?.houseNumber,
  } as const;

  const emirateError = req.emirate && touched.emirateId && !local.emirateId;
  const areaError = req.area && touched.areaId && !local.areaId;
  const streetError =
    req.streetName && touched.streetName && !local.streetName?.trim();
  const houseError =
    req.houseNumber && touched.houseNumber && !local.houseNumber?.trim();

  const isRTL = locale === "ar";

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      className={cn(
        "space-y-6 bg-card rounded-xl p-6 border border-border/50 shadow-sm",
        layout === "grid" ? "" : "",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {children}
    </div>
  );

  return (
    <Wrapper>
      {/* Section title */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-base font-semibold text-foreground">{t.pickLocation.title}</h3>
      </div>

      {/* Emirate select */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          {l.emirate}
          {req.emirate && <span className="text-destructive">*</span>}
        </label>
        <Select
          dir={isRTL ? "rtl" : "ltr"}
          disabled={disabled || emiratesLoading}
          value={local.emirateId ? String(local.emirateId) : undefined}
          onValueChange={(v) => {
            const id = Number(v);
            emit({ emirateId: id, areaId: undefined });
          }}
          onOpenChange={(o) => {
            if (!o) setTouched((t) => ({ ...t, emirateId: true }));
          }}
        >
          <SelectTrigger
            className={cn(
              "h-12 rounded-xl border-2 bg-background shadow-sm transition-all duration-200",
              "hover:border-primary/50 hover:shadow-md focus:border-primary focus:ring-4 focus:ring-primary/10",
              "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
              emiratesLoading && "animate-pulse",
              emirateError &&
                "border-destructive/50 focus:border-destructive focus:ring-destructive/10",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <SelectValue
              placeholder={emiratesLoading ? t.pickLocation.loading : l.emirate}
            />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
            {emirates.map((e) => (
              <SelectItem
                key={e.Id}
                value={String(e.Id)}
                className={cn(
                  "cursor-pointer hover:bg-primary/10 focus:bg-primary/10 rounded-lg my-0.5 transition-colors",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                {locale === "ar" ? e.TitleAr : e.TitleEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {emirateError && (
          <p className="text-xs text-destructive flex items-center gap-1.5 animate-in slide-in-from-top-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {l.requiredField}
          </p>
        )}
      </div>
      {!isAbuDhabiSelected && (
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
                disabled || !local.emirateId || emiratesLoading || areasLoading
              }
              value={local.areaId ? String(local.areaId) : undefined}
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
      )}

      {isAbuDhabiSelected && (
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

          {/* Plot number inquiry */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {locale === "ar" ? "الاستعلام برقم القطعة" : "Plot Number Inquiry"}
              </label>
              <Input
                disabled={disabled}
                placeholder={locale === "ar" ? "أدخل رقم القطعة" : "Enter plot number"}
                className={cn(
                  "h-12 rounded-xl border-2 bg-background shadow-sm transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-md focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
                  "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
                )}
              />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-muted/30 px-2 text-muted-foreground">
                  {locale === "ar" ? "أو" : "OR"}
                </span>
              </div>
            </div>

            <button
              type="button"
              className={cn(
                "h-12 w-full rounded-xl font-medium shadow-sm transition-all duration-200",
                "bg-aegreen-600 text-white hover:bg-aegreen-700 active:scale-[0.98]",
                "focus:outline-none focus:ring-4 focus:ring-aegreen-500/30",
                "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
                "flex items-center justify-center gap-2"
              )}
              disabled={disabled}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {locale === "ar" ? "اختر من الخريطة" : "Select From Map"}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {locale === "ar" ? "سيتم ملء البيانات السكنية تلقائياً" : "Residential data will be automatically filled"}
            </p>
          </div>

          {/* Region select */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {locale === "ar" ? "المنطقة" : "Region"}
              <span className="text-destructive">*</span>
            </label>
            <Select
              dir={isRTL ? "rtl" : "ltr"}
              disabled={disabled || regionsLoading}
              value={local.regionId ? String(local.regionId) : undefined}
              onValueChange={(v) => {
                const id = Number(v);
                emit({ regionId: id, zoneId: undefined, areaId: undefined });
              }}
              onOpenChange={(o) => {
                if (!o) setTouched((t) => ({ ...t, regionId: true }));
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-12 rounded-xl border-2 bg-background shadow-sm transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-md focus:border-primary focus:ring-4 focus:ring-primary/10",
                  "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
                  regionsLoading && "animate-pulse",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                <SelectValue
                  placeholder={regionsLoading ? t.pickLocation.loading : (locale === "ar" ? "المنطقة" : "Region")}
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
                {regions.length === 0 && !regionsLoading && (
                  <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    {locale === "ar" ? "لا توجد مناطق" : "No regions available"}
                  </div>
                )}
                {regions.map((r) => (
                  <SelectItem
                    key={r.Id}
                    value={String(r.Id)}
                    className={cn(
                      "cursor-pointer hover:bg-primary/10 focus:bg-primary/10 rounded-lg my-0.5 transition-colors",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {locale === "ar" ? r.TitleAr : r.TitleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone select */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {locale === "ar" ? "النطاق" : "Zone"}
              <span className="text-destructive">*</span>
            </label>
            <Select
              dir={isRTL ? "rtl" : "ltr"}
              disabled={disabled || !local.regionId || zonesLoading}
              value={local.zoneId ? String(local.zoneId) : undefined}
              onValueChange={(v) => {
                const id = Number(v);
                emit({ zoneId: id, areaId: undefined });
              }}
              onOpenChange={(o) => {
                if (!o) setTouched((t) => ({ ...t, zoneId: true }));
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-12 rounded-xl border-2 bg-background shadow-sm transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-md focus:border-primary focus:ring-4 focus:ring-primary/10",
                  "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
                  zonesLoading && "animate-pulse",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                <SelectValue
                  placeholder={zonesLoading ? t.pickLocation.loading : (locale === "ar" ? "النطاق" : "Zone")}
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
                {zones.length === 0 && !zonesLoading && (
                  <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    {locale === "ar" ? "لا توجد نطاقات" : "No zones available"}
                  </div>
                )}
                {zones.map((z) => (
                  <SelectItem
                    key={z.Id}
                    value={String(z.Id)}
                    className={cn(
                      "cursor-pointer hover:bg-primary/10 focus:bg-primary/10 rounded-lg my-0.5 transition-colors",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {locale === "ar" ? z.TitleAr : z.TitleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area select for Abu Dhabi */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {l.area}
              <span className="text-destructive">*</span>
            </label>
            <Select
              dir={isRTL ? "rtl" : "ltr"}
              disabled={disabled || !local.zoneId || abuDhabiAreasLoading}
              value={local.areaId ? String(local.areaId) : undefined}
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
                  abuDhabiAreasLoading && "animate-pulse",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                <SelectValue
                  placeholder={abuDhabiAreasLoading ? t.pickLocation.loading : l.area}
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
                {(abuDhabiAreasData?.data ?? []).length === 0 && !abuDhabiAreasLoading && (
                  <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    {t.pickLocation.noAreas}
                  </div>
                )}
                {(abuDhabiAreasData?.data ?? []).map((a) => (
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
          </div>
        </div>
      )}
    </Wrapper>
  );
}

export default AddressPicker;
