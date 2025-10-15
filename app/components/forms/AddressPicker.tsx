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
      className={cn(layout === "grid" ? "" : "space-y-4", className)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {children}
    </div>
  );

  return (
    <Wrapper>
      {/* Section title for accessibility */}
      <h3 className="sr-only">{t.pickLocation.title}</h3>
      {/* Emirate select */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {l.emirate}
          {req.emirate && <span className="text-destructive"> *</span>}
        </label>
        <Select
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
              "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
              "hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
              emirateError &&
                "border-destructive focus:border-destructive focus:ring-destructive/20"
            )}
          >
            <SelectValue
              placeholder={emiratesLoading ? t.pickLocation.loading : l.emirate}
            />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            {emirates.map((e) => (
              <SelectItem
                key={e.Id}
                value={String(e.Id)}
                className="cursor-pointer hover:bg-primary/10"
              >
                {locale === "ar" ? e.TitleAr : e.TitleEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {emirateError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <span>⚠</span> {l.requiredField}
          </p>
        )}
      </div>
      {!isAbuDhabiSelected && (
        <div id="DubaiNorthEmirate">
          {/* Area select (depends on emirate) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.area}
              {req.area && <span className="text-destructive"> *</span>}
            </label>
            <Select
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
                  "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
                  "hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                  areaError &&
                    "border-destructive focus:border-destructive focus:ring-destructive/20"
                )}
              >
                <SelectValue
                  placeholder={areasLoading ? t.pickLocation.loading : l.area}
                />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {areas.length === 0 && !areasLoading && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    {t.pickLocation.noAreas}
                  </div>
                )}
                {areas.map((a) => (
                  <SelectItem
                    key={a.Id}
                    value={String(a.Id)}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    {locale === "ar" ? a.TitleAr : a.TitleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {areaError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span>⚠</span> {l.requiredField}
              </p>
            )}
          </div>

          {/* Street name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.streetName}
              {req.streetName && <span className="text-destructive"> *</span>}
            </label>
            <Input
              disabled={disabled}
              value={local.streetName ?? ""}
              onChange={(e) => emit({ streetName: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, streetName: true }))}
              className={cn(
                "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
                "hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                streetError &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              )}
              placeholder={l.streetName}
            />
            {streetError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span>⚠</span> {l.requiredField}
              </p>
            )}
          </div>

          {/* House number */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.houseNumber}
              {req.houseNumber && <span className="text-destructive"> *</span>}
            </label>
            <Input
              disabled={disabled}
              value={local.houseNumber ?? ""}
              onChange={(e) => emit({ houseNumber: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, houseNumber: true }))}
              className={cn(
                "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
                "hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
                houseError &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              )}
              placeholder={l.houseNumber}
            />
            {houseError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span>⚠</span> {l.requiredField}
              </p>
            )}
          </div>
        </div>
      )}

      {isAbuDhabiSelected && (
        <>
          {/* Plot number inquiry */}
          <div className="mt-5 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {locale === "ar" ? "الاستعلام برقم القطعة" : "Inquiry through plot number"}
              </label>
              <Input
                disabled={disabled}
                placeholder={locale === "ar" ? "أدخل رقم القطعة" : "Enter plot number"}
                className={cn(
                  "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
                  "hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                )}
              />
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-5">
            {locale === "ar" ? "سيتم ملء البيانات السكنية تلقائياً" : "Residential data will be automatically filled"}
          </p>

          <div className="mb-5">
            <button
              type="button"
              className="h-11 w-full rounded-lg bg-emerald-700 px-4 font-medium text-white shadow-sm
                hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30
                disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              {locale === "ar" ? "اختر من الخريطة" : "Select From Map"}
            </button>
          </div>

          {/* Region select */}
          <div className="flex flex-col gap-2 mb-5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {locale === "ar" ? "المنطقة" : "Region"}
              <span className="text-destructive"> *</span>
            </label>
            <Select
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
                  "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
                  "hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                )}
              >
                <SelectValue
                  placeholder={regionsLoading ? t.pickLocation.loading : (locale === "ar" ? "المنطقة" : "Region")}
                />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {regions.length === 0 && !regionsLoading && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    {locale === "ar" ? "لا توجد مناطق" : "No regions available"}
                  </div>
                )}
                {regions.map((r) => (
                  <SelectItem
                    key={r.Id}
                    value={String(r.Id)}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    {locale === "ar" ? r.TitleAr : r.TitleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone select */}
          <div className="flex flex-col gap-2 mb-5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {locale === "ar" ? "النطاق" : "Zone"}
              <span className="text-destructive"> *</span>
            </label>
            <Select
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
                  "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
                  "hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                )}
              >
                <SelectValue
                  placeholder={zonesLoading ? t.pickLocation.loading : (locale === "ar" ? "النطاق" : "Zone")}
                />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {zones.length === 0 && !zonesLoading && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    {locale === "ar" ? "لا توجد نطاقات" : "No zones available"}
                  </div>
                )}
                {zones.map((z) => (
                  <SelectItem
                    key={z.Id}
                    value={String(z.Id)}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    {locale === "ar" ? z.TitleAr : z.TitleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area select for Abu Dhabi */}
          <div className="flex flex-col gap-2 mb-5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.area}
              <span className="text-destructive"> *</span>
            </label>
            <Select
              disabled={disabled || !local.zoneId || abuDhabiAreasLoading}
              value={local.areaId ? String(local.areaId) : undefined}
              onValueChange={(v) => emit({ areaId: Number(v) })}
              onOpenChange={(o) => {
                if (!o) setTouched((t) => ({ ...t, areaId: true }));
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-11 rounded-lg border-gray-300 bg-white shadow-sm transition-colors",
                  "hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                )}
              >
                <SelectValue
                  placeholder={abuDhabiAreasLoading ? t.pickLocation.loading : l.area}
                />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {(abuDhabiAreasData?.data ?? []).length === 0 && !abuDhabiAreasLoading && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    {t.pickLocation.noAreas}
                  </div>
                )}
                {(abuDhabiAreasData?.data ?? []).map((a) => (
                  <SelectItem
                    key={a.Id}
                    value={String(a.Id)}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    {locale === "ar" ? a.TitleAr : a.TitleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </Wrapper>
  );
}

export default AddressPicker;
