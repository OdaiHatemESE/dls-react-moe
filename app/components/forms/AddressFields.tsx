"use client";

import * as React from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/app/i18n/I18nProvider";

type Emirate = { Id: number; TitleAr: string; TitleEn: string; IsActive: boolean };
type Area = { Id: number; TitleAr: string; TitleEn: string; IsActive: boolean; ZoneId: number; ManhalCode: string | null };

export type AddressValue = {
  emirateId?: number | null;
  areaId?: number | null;
  streetName?: string;
  houseNumber?: string;
};

export type AddressFieldsProps = {
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

type AreasMeta = { zoneId: number; isAbuDhabi: boolean; gradeCode: string | null; genderCode: string | null; count: number };

function useAreas(params: { emirateId?: number | null; isAbuDhabi?: boolean; zoneIdOverride?: number | null; gradeCode?: string; genderCode?: string }) {
  const { emirateId, isAbuDhabi = false, zoneIdOverride, gradeCode, genderCode } = params;
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

export function AddressFields(props: AddressFieldsProps) {
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

  const { locale } = useI18n();

  const [local, setLocal] = React.useState<AddressValue>(() => ({
    emirateId: value?.emirateId ?? undefined,
    areaId: value?.areaId ?? undefined,
    streetName: value?.streetName ?? "",
    houseNumber: value?.houseNumber ?? "",
  }));

  // keep in sync with external value
  React.useEffect(() => {
    setLocal((prev) => ({
      emirateId: value?.emirateId ?? prev.emirateId,
      areaId: value?.areaId ?? (value?.emirateId !== prev.emirateId ? undefined : prev.areaId),
      streetName: value?.streetName ?? prev.streetName,
      houseNumber: value?.houseNumber ?? prev.houseNumber,
    }));
  }, [value?.emirateId, value?.areaId, value?.streetName, value?.houseNumber]);

  const emit = React.useCallback(
    (next: Partial<AddressValue>) => {
      const merged = { ...local, ...next };
      setLocal(merged);
      onChange?.(merged);
    },
    [local, onChange]
  );

  const { data: emiratesData, isLoading: emiratesLoading } = useEmirates();
  const { data: areasData, isLoading: areasLoading } = useAreas({
    emirateId: local.emirateId ?? undefined,
    isAbuDhabi,
    zoneIdOverride: props.abuDhabiZoneIdOverride ?? null,
    gradeCode,
    genderCode,
  });

  const emirates = emiratesData?.data ?? [];
  const areas = areasData?.data ?? [];

  const [touched, setTouched] = React.useState<{ [K in keyof AddressValue]?: boolean }>({});

  const l = {
    emirate: labels?.emirate ?? "الإمارة",
    area: labels?.area ?? "المنطقة",
    streetName: labels?.streetName ?? "رقم / اسم الشارع",
    houseNumber: labels?.houseNumber ?? "رقم المنزل",
    requiredField: labels?.requiredField ?? "الحقل مطلوب",
  };

  const req = {
    emirate: !!required?.emirate,
    area: !!required?.area,
    streetName: !!required?.streetName,
    houseNumber: !!required?.houseNumber,
  } as const;

  const emirateError = req.emirate && touched.emirateId && !local.emirateId;
  const areaError = req.area && touched.areaId && !local.areaId;
  const streetError = req.streetName && touched.streetName && !local.streetName?.trim();
  const houseError = req.houseNumber && touched.houseNumber && !local.houseNumber?.trim();

  const isRTL = locale === 'ar';

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div 
      className={cn(
        layout === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "space-y-4", 
        className
      )} 
      dir={isRTL ? "rtl" : "ltr"}
    >
      {children}
    </div>
  );

  return (
    <Wrapper>
      {/* Area select (depends on emirate) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {l.area}
          {req.area && <span className="text-destructive"> *</span>}
        </label>
        <Select
          disabled={disabled || !local.emirateId || emiratesLoading || areasLoading}
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
              areaError && "border-destructive focus:border-destructive focus:ring-destructive/20"
            )}
          > 
            <SelectValue placeholder={areasLoading ? "جاري التحميل..." : l.area} />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            {areas.length === 0 && !areasLoading && (
              <div className="p-2 text-sm text-gray-500 text-center">لا توجد مناطق متاحة</div>
            )}
            {areas.map((a) => (
              <SelectItem 
                key={a.Id} 
                value={String(a.Id)}
                className="cursor-pointer hover:bg-primary/10"
              >
                {locale === 'ar' ? a.TitleAr : a.TitleEn}
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
              emirateError && "border-destructive focus:border-destructive focus:ring-destructive/20"
            )}
          > 
            <SelectValue placeholder={emiratesLoading ? "جاري التحميل..." : l.emirate} />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            {emirates.map((e) => (
              <SelectItem 
                key={e.Id} 
                value={String(e.Id)}
                className="cursor-pointer hover:bg-primary/10"
              >
                {locale === 'ar' ? e.TitleAr : e.TitleEn}
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
            houseError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
          )}
          placeholder={l.houseNumber}
        />
        {houseError && (
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
            streetError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
          )}
          placeholder={l.streetName}
        />
        {streetError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <span>⚠</span> {l.requiredField}
          </p>
        )}
      </div>
    </Wrapper>
  );
}

export default AddressFields;
