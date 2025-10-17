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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/app/i18n/I18nProvider";
import MyLandPicker from "@/app/components/Onwani/MyLandPicker";
import type { OnwaniSelection, PlotLookupResponse } from "@/types";

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

export type AddressValue = {
  emirateId?: number | null;
  areaId?: number | null;
  streetName?: string;
  houseNumber?: string;
  // Abu Dhabi specific fields
  regionId?: number | null;
  zoneId?: number | null;
  plotId?: number | null;
  longitude?: number | null;
  latitude?: number | null;
};

// Normalizes coordinate values returned as strings from the Onwani API
const toFiniteNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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
    longitude: value?.longitude ?? undefined,
    latitude: value?.latitude ?? undefined,
  }));

  // Dialog state for MyLandPicker
  const [isMapDialogOpen, setIsMapDialogOpen] = React.useState(false);
  const [pendingSelection, setPendingSelection] = React.useState<OnwaniSelection | null>(null);
  const [hasMapSelection, setHasMapSelection] = React.useState(false);
  // Store the last confirmed selection to reload when reopening the dialog
  const [lastConfirmedSelection, setLastConfirmedSelection] = React.useState<OnwaniSelection | null>(null);

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
      longitude: value?.longitude ?? prev.longitude,
      latitude: value?.latitude ?? prev.latitude,
    }));
  }, [
    value?.emirateId,
    value?.areaId,
    value?.streetName,
    value?.houseNumber,
    value?.regionId,
    value?.zoneId,
    value?.plotId,
    value?.longitude,
    value?.latitude,
  ]);

  const emit = React.useCallback(
    (next: Partial<AddressValue>) => {
      const merged = { ...local, ...next };
      setLocal(merged);
      onChange?.(merged);
    },
    [local, onChange]
  );

  // Handler for MyLandPicker selection
  const handleMapSelection = React.useCallback(
    (selection: OnwaniSelection) => {
      console.log("Map selection received:", selection);
      setPendingSelection(selection);
    },
    []
  );

  // Handler to cancel map selection
  const handleCancelMapSelection = React.useCallback(() => {
    setIsMapDialogOpen(false);
    setPendingSelection(null);
  }, []);

  // Handler for dialog open/close state changes
  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    setIsMapDialogOpen(open);
    // Clear pending selection when closing the dialog
    if (!open) {
      setPendingSelection(null);
    }
  }, []);

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

  React.useEffect(() => {
    if (!isAbuDhabiSelected && hasMapSelection) {
      setHasMapSelection(false);
    }
  }, [isAbuDhabiSelected, hasMapSelection]);

  // Fetch Abu Dhabi hierarchical data
  const { data: regionsData, isLoading: regionsLoading } = useRegions(
    isAbuDhabiSelected ? local.emirateId : null
  );
  const regions = React.useMemo(() => regionsData?.data ?? [], [regionsData]);

  const { data: zonesData, isLoading: zonesLoading } = useZones(
    isAbuDhabiSelected ? local.regionId : null
  );
  const zones = React.useMemo(() => zonesData?.data ?? [], [zonesData]);

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

  const areas = React.useMemo(() => areasData?.data ?? [], [areasData]);

  // Handler to confirm and apply the map selection
  const handleConfirmSelection = React.useCallback(() => {
    if (!pendingSelection) return;

    const plotResponse: PlotLookupResponse | undefined = pendingSelection.dbPlotResponse;
    if (!plotResponse || !Array.isArray(plotResponse.data) || plotResponse.data.length === 0) {
      console.warn("AddressPicker: No plot data available for the selected location", plotResponse);
      return;
    }

  const [record] = plotResponse.data;
    if (!record) {
      console.warn("AddressPicker: Plot response was empty", plotResponse);
      return;
    }

    const emirateId = record.hierarchy.region.emirateId ?? null;
    const regionId = record.hierarchy.region.id ?? null;
    const zoneId = record.hierarchy.zone.id ?? null;
    const areaId = record.identifiers.areaId ?? record.hierarchy.area.id ?? null;
    const plotId = record.identifiers.plotId ?? record.plot.id ?? null;
    const streetName = record.location.roadNumber ?? pendingSelection.roadId;
    const houseNumberSource = pendingSelection.plot?.trim() || record.identifiers.mainPlotId || record.plot.titles.en;
    const nextLongitude = toFiniteNumber(record.location.coordinates?.longitude);
    const nextLatitude = toFiniteNumber(record.location.coordinates?.latitude);

    const updates: Partial<AddressValue> = {
      emirateId: emirateId ?? local.emirateId,
      areaId: areaId ?? local.areaId,
      longitude: nextLongitude,
      latitude: nextLatitude,
    };

    if (isAbuDhabiSelected) {
      updates.regionId = regionId ?? undefined;
      updates.zoneId = zoneId ?? undefined;
      updates.plotId = plotId ?? undefined;
      updates.streetName = undefined;
      updates.houseNumber = undefined;
    } else {
      updates.regionId = undefined;
      updates.zoneId = undefined;
      updates.plotId = undefined;
      updates.streetName = streetName?.trim() || undefined;
      updates.houseNumber = houseNumberSource?.trim() || undefined;
    }

    emit(updates);
    setHasMapSelection(true);
    setLastConfirmedSelection(pendingSelection); // Store for reopening
    setIsMapDialogOpen(false);
    setPendingSelection(null);
  }, [pendingSelection, emit, isAbuDhabiSelected, local.areaId, local.emirateId, setHasMapSelection, setIsMapDialogOpen, setPendingSelection]);

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
  const lockAbuDhabiFields = isAbuDhabiSelected && hasMapSelection;

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

            <Button
              type="button"
              onClick={() => setIsMapDialogOpen(true)}
              className={cn(
                "h-12 w-full rounded-xl font-medium shadow-sm transition-all duration-200",
                hasMapSelection 
                  ? "bg-aegreen-600/20 text-aegreen-700 border-2 border-aegreen-600/50 hover:bg-aegreen-600/30 hover:border-aegreen-600/60" 
                  : "bg-aegreen-600 text-white hover:bg-aegreen-700",
                "active:scale-[0.98]",
                "focus:outline-none focus:ring-4 focus:ring-aegreen-500/30",
                "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
                "flex items-center justify-center gap-2"
              )}
              disabled={disabled}
            >
              {hasMapSelection ? (
                <>
                  <svg className="w-5 h-5 animate-in zoom-in duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locale === "ar" ? "تم اختيار الموقع من الخريطة" : "Location Selected from Map"}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {locale === "ar" ? "اختر من الخريطة" : "Select From Map"}
                </>
              )}
            </Button>

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
                disabled={disabled || regionsLoading || lockAbuDhabiFields}
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
              disabled={
                disabled ||
                !local.regionId ||
                zonesLoading ||
                lockAbuDhabiFields
              }
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
              disabled={
                disabled ||
                !local.zoneId ||
                abuDhabiAreasLoading ||
                lockAbuDhabiFields
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

      {/* MyLand Map Picker Dialog - Two Column Layout */}
      <Dialog open={isMapDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent 
          className={cn(
            "max-w-[98vw] w-full h-[96vh] p-0 gap-0 flex flex-col overflow-hidden",
            "bg-background border-2 shadow-2xl",
            isRTL ? "rtl" : "ltr"
          )}
        >
          {/* Compact Header */}
          <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-aegreen-50 to-aegreen-100/50 dark:from-aegreen-950/30 dark:to-aegreen-900/20 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="p-1.5 rounded-lg bg-aegreen-600 text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <span className="text-aegreen-900 dark:text-aegreen-100">
                  {locale === "ar" ? "اختر موقعك" : "Select Your Location"}
                </span>
              </DialogTitle>
              {pendingSelection && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-aegreen-700 dark:text-aegreen-400">
                  <div className="w-2 h-2 rounded-full bg-aegreen-600 animate-pulse"></div>
                  {locale === "ar" ? "تم التحديد" : "Location Selected"}
                </div>
              )}
            </div>
          </DialogHeader>
          
          {/* Two Column Layout */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Column - Map */}
            <div className="flex-1 relative bg-muted/20 min-h-0">
              {/* MyLandPicker - Full width/height */}
              <div className="absolute inset-0 w-full h-full">
                <MyLandPicker
                  defaultMunicipality="ADM"
                  showOverlayShape={true}
                  onOk={handleMapSelection}
                  onCancel={handleCancelMapSelection}
                  className="w-full h-full"
                  initialSelection={lastConfirmedSelection ?? undefined}
                />
              </div>

              {/* Floating Help Tip - Show only when no selection (mobile view) */}
              {!pendingSelection && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-in fade-in duration-500 md:hidden">
                  <div className="bg-gray-900/90 dark:bg-gray-800/90 text-white rounded-full px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-sm flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    {locale === "ar" ? "انقر على الخريطة" : "Click on the map"}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Selection Details */}
            <div className={cn(
              "w-full md:w-96 lg:w-[28rem] border-t md:border-t-0 md:border-s border-border/50 bg-card flex flex-col",
              "max-h-[40vh] md:max-h-full"
            )}>
              {/* Selection Header */}
              <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-aegreen-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="text-sm font-bold text-foreground">
                    {locale === "ar" ? "تفاصيل الموقع" : "Location Details"}
                  </h3>
                </div>
              </div>

              {/* Selection Content - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {!pendingSelection ? (
                  /* Empty State */
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      {locale === "ar" ? "لم يتم التحديد بعد" : "No Location Selected"}
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {locale === "ar" 
                        ? "انقر على الخريطة لتحديد موقعك. ستظهر التفاصيل الكاملة هنا." 
                        : "Click on the map to select your location. Full details will appear here."}
                    </p>
                  </div>
                ) : (() => {
                  /* Selected State - Show Full Details */
                  const plotData = pendingSelection.dbPlotResponse?.data?.[0];
                  const hasDetailedData = !!plotData;
                  
                  return (
                    <div className="p-4 space-y-3">
                      {/* Basic Selection Info */}
                      <div className="space-y-2.5">
                        {/* District */}
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-aegreen-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {locale === "ar" ? "المنطقة" : "District"}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                              {pendingSelection.districtEn}
                            </p>
                          </div>
                        </div>

                        {/* Community */}
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-aegreen-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {locale === "ar" ? "المجمع السكني" : "Community"}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                              {pendingSelection.communityEn}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Database Plot Response */}
                      {hasDetailedData && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-aegreen-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {locale === "ar" ? "تفاصيل القطعة الكاملة" : "Complete Plot Details"}
                            </h5>
                          </div>                          {/* Plot Information - Emphasized */}
                          <div className="bg-aegreen-50 dark:bg-aegreen-950/30 rounded-lg p-3 border border-aegreen-200/50 dark:border-aegreen-800/50 space-y-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-aegreen-700 dark:text-aegreen-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <h6 className="text-xs font-bold text-aegreen-900 dark:text-aegreen-300">
                                {locale === "ar" ? "معلومات القطعة" : "Plot Information"}
                              </h6>
                            </div>
                            
                            {plotData.plot?.titles && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {plotData.plot.titles.en && (
                                  <div>
                                    <p className="text-[10px] text-aegreen-700 dark:text-aegreen-400 uppercase tracking-wide">
                                      {locale === "ar" ? "الاسم (EN)" : "Name (EN)"}
                                    </p>
                                    <p className="font-semibold text-aegreen-900 dark:text-aegreen-200 break-words">{plotData.plot.titles.en}</p>
                                  </div>
                                )}
                                {plotData.plot.titles.ar && (
                                  <div>
                                    <p className="text-[10px] text-aegreen-700 dark:text-aegreen-400 uppercase tracking-wide">
                                      {locale === "ar" ? "الاسم (AR)" : "Name (AR)"}
                                    </p>
                                    <p className="font-semibold text-aegreen-900 dark:text-aegreen-200 break-words">{plotData.plot.titles.ar}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {plotData.plot?.id && (
                              <div>
                                <p className="text-[10px] text-aegreen-700 dark:text-aegreen-400 uppercase tracking-wide">
                                  {locale === "ar" ? "معرف القطعة" : "Plot ID"}
                                </p>
                                <p className="font-bold text-base text-aegreen-900 dark:text-aegreen-200">{plotData.plot.id}</p>
                              </div>
                            )}
                          </div>

                          {/* Identifiers */}
                          {plotData.identifiers && (
                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50 space-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-700 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <h6 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                                  {locale === "ar" ? "المعرفات" : "Identifiers"}
                                </h6>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {plotData.identifiers.plotId && (
                                  <div>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase">Plot ID</p>
                                    <p className="font-semibold text-blue-900 dark:text-blue-200">{plotData.identifiers.plotId}</p>
                                  </div>
                                )}
                                {plotData.identifiers.areaId && (
                                  <div>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase">Area ID</p>
                                    <p className="font-semibold text-blue-900 dark:text-blue-200">{plotData.identifiers.areaId}</p>
                                  </div>
                                )}
                                {plotData.identifiers.mainPlotId && (
                                  <div>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase">Main Plot</p>
                                    <p className="font-semibold text-blue-900 dark:text-blue-200">{plotData.identifiers.mainPlotId}</p>
                                  </div>
                                )}
                                {plotData.identifiers.premisesPlotId && (
                                  <div>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase">Premises</p>
                                    <p className="font-semibold text-blue-900 dark:text-blue-200">{plotData.identifiers.premisesPlotId}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Hierarchy */}
                          {plotData.hierarchy && (
                            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200/50 dark:border-purple-800/50 space-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-700 dark:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <h6 className="text-xs font-bold text-purple-900 dark:text-purple-300">
                                  {locale === "ar" ? "التسلسل الهرمي" : "Hierarchy"}
                                </h6>
                              </div>
                              
                              {/* Region */}
                              {plotData.hierarchy.region && (
                                <div className="border-s-2 border-purple-300 dark:border-purple-700 ps-2">
                                  <p className="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-semibold">
                                    {locale === "ar" ? "المنطقة" : "Region"}
                                  </p>
                                  <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                                    {locale === "ar" ? plotData.hierarchy.region.titles.ar || plotData.hierarchy.region.titles.en : plotData.hierarchy.region.titles.en || plotData.hierarchy.region.titles.ar}
                                  </p>
                                  {plotData.hierarchy.region.id && (
                                    <p className="text-[10px] text-purple-600 dark:text-purple-400">ID: {plotData.hierarchy.region.id}</p>
                                  )}
                                </div>
                              )}

                              {/* Zone */}
                              {plotData.hierarchy.zone && (
                                <div className="border-s-2 border-purple-300 dark:border-purple-700 ps-2">
                                  <p className="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-semibold">
                                    {locale === "ar" ? "النطاق" : "Zone"}
                                  </p>
                                  <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                                    {locale === "ar" ? plotData.hierarchy.zone.titles.ar || plotData.hierarchy.zone.titles.en : plotData.hierarchy.zone.titles.en || plotData.hierarchy.zone.titles.ar}
                                  </p>
                                  {plotData.hierarchy.zone.id && (
                                    <p className="text-[10px] text-purple-600 dark:text-purple-400">ID: {plotData.hierarchy.zone.id}</p>
                                  )}
                                </div>
                              )}

                              {/* Area */}
                              {plotData.hierarchy.area && (
                                <div className="border-s-2 border-purple-300 dark:border-purple-700 ps-2">
                                  <p className="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-semibold">
                                    {locale === "ar" ? "المنطقة السكنية" : "Area"}
                                  </p>
                                  <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                                    {locale === "ar" ? plotData.hierarchy.area.titles.ar || plotData.hierarchy.area.titles.en : plotData.hierarchy.area.titles.en || plotData.hierarchy.area.titles.ar}
                                  </p>
                                  <div className="flex gap-3 text-[10px] text-purple-600 dark:text-purple-400">
                                    {plotData.hierarchy.area.id && <span>ID: {plotData.hierarchy.area.id}</span>}
                                    {plotData.hierarchy.area.manhalCode && <span>Manhal: {plotData.hierarchy.area.manhalCode}</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Location & Coordinates */}
                          {plotData.location && (
                            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200/50 dark:border-orange-800/50 space-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-700 dark:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <h6 className="text-xs font-bold text-orange-900 dark:text-orange-300">
                                  {locale === "ar" ? "الموقع والإحداثيات" : "Location & Coordinates"}
                                </h6>
                              </div>
                              
                              {plotData.location.roadNumber && (
                                <div>
                                  <p className="text-[10px] text-orange-700 dark:text-orange-400 uppercase">
                                    {locale === "ar" ? "رقم الطريق" : "Road Number"}
                                  </p>
                                  <p className="text-xs font-semibold text-orange-900 dark:text-orange-200">{plotData.location.roadNumber}</p>
                                </div>
                              )}
                              
                              {plotData.location.coordinates && (plotData.location.coordinates.latitude || plotData.location.coordinates.longitude) && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {plotData.location.coordinates.latitude && (
                                    <div>
                                      <p className="text-[10px] text-orange-700 dark:text-orange-400 uppercase">Latitude</p>
                                      <p className="font-mono font-semibold text-orange-900 dark:text-orange-200 text-[10px]">{plotData.location.coordinates.latitude}</p>
                                    </div>
                                  )}
                                  {plotData.location.coordinates.longitude && (
                                    <div>
                                      <p className="text-[10px] text-orange-700 dark:text-orange-400 uppercase">Longitude</p>
                                      <p className="font-mono font-semibold text-orange-900 dark:text-orange-200 text-[10px]">{plotData.location.coordinates.longitude}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {plotData.location.onwani && (
                                <div className="text-[10px] text-orange-600 dark:text-orange-400 space-y-0.5">
                                  {plotData.location.onwani.mapMapping && <p>Map: {plotData.location.onwani.mapMapping}</p>}
                                  {plotData.location.onwani.legacyKey && <p>Legacy: {plotData.location.onwani.legacyKey}</p>}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Simple data when no detailed plot response */}
                      {!hasDetailedData && (
                        <>
                          {pendingSelection.plot && (
                            <div className="flex items-start gap-2 bg-aegreen-50 dark:bg-aegreen-950/30 rounded-lg p-2.5 border border-aegreen-200/50 dark:border-aegreen-800/50">
                              <svg className="w-4 h-4 text-aegreen-700 dark:text-aegreen-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-aegreen-700 dark:text-aegreen-400 uppercase tracking-wide font-semibold">
                                  {locale === "ar" ? "رقم القطعة" : "Plot Number"}
                                </p>
                                <p className="text-base font-bold text-aegreen-900 dark:text-aegreen-300 break-words">
                                  {pendingSelection.plot}
                                </p>
                              </div>
                            </div>
                          )}

                          {pendingSelection.roadId && (
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-aegreen-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {locale === "ar" ? "الطريق" : "Road"}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                                  {pendingSelection.roadId}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-aegreen-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {locale === "ar" ? "البلدية" : "Municipality"}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {pendingSelection.municipality === "ADM" 
                                  ? (locale === "ar" ? "بلدية أبوظبي" : "Abu Dhabi Municipality")
                                  : pendingSelection.municipality}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Confirmation Hint */}
                      <div className="mt-4 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {locale === "ar" 
                            ? "تأكد من صحة جميع البيانات قبل الاستمرار" 
                            : "Verify all details are correct before confirming"}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Compact Action Footer - Always Visible */}
          <div className="px-4 py-3 border-t bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between gap-3">
              {/* Info text when no selection */}
              {!pendingSelection && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locale === "ar" ? "حدد موقعك أولاً" : "Select location first"}
                </p>
              )}
              
              {/* Selection count when selected */}
              {pendingSelection && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-aegreen-700 dark:text-aegreen-400">
                  <div className="w-2 h-2 rounded-full bg-aegreen-600 animate-pulse"></div>
                  {locale === "ar" ? "جاهز للتأكيد" : "Ready to confirm"}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelMapSelection}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                    "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50",
                    "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
                    "border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-gray-400/30",
                    "active:scale-95"
                  )}
                >
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={!pendingSelection}
                  className={cn(
                    "px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200",
                    "flex items-center justify-center gap-2 min-w-[140px]",
                    pendingSelection
                      ? "bg-gradient-to-r from-aegreen-600 to-aegreen-700 hover:from-aegreen-700 hover:to-aegreen-800 text-white shadow-lg shadow-aegreen-600/40 hover:shadow-xl hover:shadow-aegreen-600/50 scale-105 hover:scale-110"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60",
                    "focus:outline-none focus:ring-4 focus:ring-aegreen-500/40",
                    "active:scale-100",
                    "disabled:active:scale-100 disabled:hover:scale-100",
                    "relative overflow-hidden"
                  )}
                >
                  {pendingSelection && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  )}
                  <svg className={cn("w-5 h-5", pendingSelection && "animate-bounce")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="relative">
                    {locale === "ar" ? "تأكيد الاختيار" : "Confirm Selection"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export default AddressPicker;
