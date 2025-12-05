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
import type { OnwaniSelection, OnwaniMapResponse } from "@/types";
import { DubaiNorthernEmiratesFields, AbuDhabiEmirateFields } from "./AddressPickerComponents";

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
  municipalityNameEn?: string | null;
  municipalityNameAr?: string | null;
  fullAddressEn?: string | null;
  fullAddressAr?: string | null;
};

type AddressLookups = {
  emirates: Emirate[];
  areas: Area[];
  abuDhabiAreas: Area[];
  regions: Region[];
  zones: Zone[];
};

const emptyLookups: AddressLookups = {
  emirates: [],
  areas: [],
  abuDhabiAreas: [],
  regions: [],
  zones: [],
};

function enrichAddressWithLookups(
  value: AddressValue,
  lookups: AddressLookups
): AddressValue {
  const next: AddressValue = { ...value };

  if (value.emirateId) {
    const emirate = lookups.emirates.find((item) => item.Id === value.emirateId);
    if (emirate) {
      next.emirateNameEn = emirate.TitleEn ?? value.emirateNameEn ?? null;
      next.emirateNameAr = emirate.TitleAr ?? value.emirateNameAr ?? null;
    }
    // Keep existing names if lookup not found
  } else {
    next.emirateNameEn = null;
    next.emirateNameAr = null;
  }

  const allAreas = [...lookups.areas, ...lookups.abuDhabiAreas];
  if (value.areaId) {
    const area = allAreas.find((item) => item.Id === value.areaId);
    if (area) {
      next.areaNameEn = area.TitleEn ?? value.areaNameEn ?? null;
      next.areaNameAr = area.TitleAr ?? value.areaNameAr ?? null;
    }
    // Keep existing names if lookup not found
  } else {
    next.areaNameEn = null;
    next.areaNameAr = null;
  }

  if (value.regionId) {
    const region = lookups.regions.find((item) => item.Id === value.regionId);
    if (region) {
      next.regionNameEn = region.TitleEn ?? value.regionNameEn ?? null;
      next.regionNameAr = region.TitleAr ?? value.regionNameAr ?? null;
    }
    // Keep existing names if lookup not found
  } else {
    next.regionNameEn = null;
    next.regionNameAr = null;
  }

  if (value.zoneId) {
    const zone = lookups.zones.find((item) => item.Id === value.zoneId);
    if (zone) {
      next.zoneNameEn = zone.TitleEn ?? value.zoneNameEn ?? null;
      next.zoneNameAr = zone.TitleAr ?? value.zoneNameAr ?? null;
    }
    // Keep existing names if lookup not found
  } else {
    next.zoneNameEn = null;
    next.zoneNameAr = null;
  }

  return next;
}

function addressShallowEqual(a: AddressValue, b: AddressValue): boolean {
  const keys = new Set([
    ...Object.keys(a ?? {}),
    ...Object.keys(b ?? {}),
  ]);
  for (const key of keys) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }
  return true;
}

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
    if (emirateId === undefined || emirateId === null) return null;
    return `/api/db/regions?emirateId=${emirateId}`;
  }, [emirateId]);
  return useSWR<{ data: Region[] }>(key, jsonFetcher);
}

function useZones(regionId?: number | null) {
  const key = React.useMemo(() => {
    if (regionId === undefined || regionId === null) return null;
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
    if (idToUse === undefined || idToUse === null) return null;
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

  // Refs for stable callbacks
  const onChangeRef = React.useRef(onChange);
  const lookupsRef = React.useRef<AddressLookups>(emptyLookups);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
    mainPlotId: value?.mainPlotId ?? undefined,
    premisesPlotId: value?.premisesPlotId ?? undefined,
  }));

  // Dialog state for MyLandPicker
  const [isMapDialogOpen, setIsMapDialogOpen] = React.useState(false);
  const [pendingSelection, setPendingSelection] = React.useState<OnwaniSelection | null>(null);
  const [hasMapSelection, setHasMapSelection] = React.useState(false);
  // Store the last confirmed selection to reload when reopening the dialog
  const [lastConfirmedSelection, setLastConfirmedSelection] = React.useState<OnwaniSelection | null>(null);

  // keep in sync with external value - only update if value actually changed
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    // Skip on initial mount as we already initialized from value
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only sync if external value exists and is different
    if (!value) return;
    
    setLocal((prev) => {
      let hasChanges = false;
      const next = { ...prev };
      
      // Only update fields that have genuinely changed
      if (value.emirateId !== undefined && value.emirateId !== prev.emirateId) {
        next.emirateId = value.emirateId;
        hasChanges = true;
        // Clear area if emirate changed
        if (value.areaId !== undefined) {
          next.areaId = value.areaId;
        }
      }
      if (value.areaId !== undefined && value.areaId !== prev.areaId && !hasChanges) {
        next.areaId = value.areaId;
        hasChanges = true;
      }
      if (value.streetName !== undefined && value.streetName !== prev.streetName) {
        next.streetName = value.streetName;
        hasChanges = true;
      }
      if (value.houseNumber !== undefined && value.houseNumber !== prev.houseNumber) {
        next.houseNumber = value.houseNumber;
        hasChanges = true;
      }
      if (value.regionId !== undefined && value.regionId !== prev.regionId) {
        next.regionId = value.regionId;
        hasChanges = true;
      }
      if (value.zoneId !== undefined && value.zoneId !== prev.zoneId) {
        next.zoneId = value.zoneId;
        hasChanges = true;
      }
      if (value.plotId !== undefined && value.plotId !== prev.plotId) {
        next.plotId = value.plotId;
        hasChanges = true;
      }
      if (value.longitude !== prev.longitude) {
        next.longitude = value.longitude;
        hasChanges = true;
      }
      if (value.latitude !== prev.latitude) {
        next.latitude = value.latitude;
        hasChanges = true;
      }
      if (value.mainPlotId !== prev.mainPlotId) {
        next.mainPlotId = value.mainPlotId;
        hasChanges = true;
      }
      if (value.premisesPlotId !== prev.premisesPlotId) {
        next.premisesPlotId = value.premisesPlotId;
        hasChanges = true;
      }
      
      // Only return new object if something actually changed
      return hasChanges ? next : prev;
    });
  }, [value]);

  const emit = React.useCallback(
    (next: Partial<AddressValue>) => {
      setLocal((prev) => {
        const merged = { ...prev, ...next };
        // Only call onChange if we're not in the middle of enrichment
        setTimeout(() => onChangeRef.current?.(merged), 0);
        return merged;
      });
    },
    []
  );

  // Handler for MyLandPicker selection
  const handleMapSelection = React.useCallback(
    (selection: OnwaniSelection) => {
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
  // BUT: Don't clear if we have a valid map selection with Abu Dhabi data
  React.useEffect(() => {
    if (!isAbuDhabiSelected) return;
    // Skip clearing if we just made a map selection
    if (hasMapSelection) return;
    
    const hasArea = local.areaId !== undefined && local.areaId !== null;
    const hasStreet = !!(local.streetName && local.streetName.trim().length > 0);
    const hasHouse = !!(local.houseNumber && local.houseNumber.trim().length > 0);
    const needsClear = hasArea || hasStreet || hasHouse;
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
  const normalizedAbuDhabiEmirateId =
    isAbuDhabiSelected && typeof local.emirateId === "number" && local.emirateId > 0
      ? local.emirateId
      : null;

  const { data: regionsData, isLoading: regionsLoading } = useRegions(
    normalizedAbuDhabiEmirateId
  );
  const regions = React.useMemo(() => regionsData?.data ?? [], [regionsData]);

  const normalizedRegionId =
    isAbuDhabiSelected && typeof local.regionId === "number" && local.regionId > 0
      ? local.regionId
      : null;

  const { data: zonesData, isLoading: zonesLoading } = useZones(
    normalizedRegionId
  );
  const zones = React.useMemo(() => zonesData?.data ?? [], [zonesData]);

  // For Abu Dhabi areas, we fetch by zoneId (not emirateId)
  const normalizedZoneId =
    isAbuDhabiSelected && typeof local.zoneId === "number" && local.zoneId > 0
      ? local.zoneId
      : null;

  const { data: abuDhabiAreasData, isLoading: abuDhabiAreasLoading } = useAreas({
    emirateId: normalizedZoneId,
    isAbuDhabi: true,
    zoneIdOverride: normalizedZoneId,
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
  const abuDhabiAreas = React.useMemo(
    () => abuDhabiAreasData?.data ?? [],
    [abuDhabiAreasData]
  );

  // Update lookups ref when they change
  React.useEffect(() => {
    lookupsRef.current = {
      emirates,
      areas,
      abuDhabiAreas,
      regions,
      zones,
    };
  }, [emirates, areas, abuDhabiAreas, regions, zones]);

  // Only enrich with name lookups when IDs or lookups change
  const lastEnrichedRef = React.useRef<{
    emirateId?: number;
    areaId?: number;
    regionId?: number;
    zoneId?: number;
  }>({});

  React.useEffect(() => {
    const current = lastEnrichedRef.current;
    const needsEnrichment = 
      local.emirateId !== current.emirateId ||
      local.areaId !== current.areaId ||
      local.regionId !== current.regionId ||
      local.zoneId !== current.zoneId;

    if (!needsEnrichment) return;

    // Skip enrichment if we already have names set (e.g., from map selection)
    const hasAreaName = !!(local.areaNameEn || local.areaNameAr);
    const hasZoneName = !!(local.zoneNameEn || local.zoneNameAr);
    const hasRegionName = !!(local.regionNameEn || local.regionNameAr);
    const hasEmirateName = !!(local.emirateNameEn || local.emirateNameAr);
    
    // If names are already present for all set IDs, skip enrichment
    const skipEnrichment = (
      (!local.areaId || hasAreaName) &&
      (!local.zoneId || hasZoneName) &&
      (!local.regionId || hasRegionName) &&
      (!local.emirateId || hasEmirateName)
    );

    if (skipEnrichment) {
      lastEnrichedRef.current = {
        emirateId: local.emirateId,
        areaId: local.areaId,
        regionId: local.regionId,
        zoneId: local.zoneId,
      };
      return;
    }

    lastEnrichedRef.current = {
      emirateId: local.emirateId,
      areaId: local.areaId,
      regionId: local.regionId,
      zoneId: local.zoneId,
    };

    setLocal((prev) => {
      const enriched = enrichAddressWithLookups(prev, lookupsRef.current);
      if (addressShallowEqual(prev, enriched)) {
        return prev;
      }
      // Keep the consumer in sync when lookups resolve new names for current IDs
      setTimeout(() => onChangeRef.current?.(enriched), 0);
      return enriched;
    });
  }, [local.emirateId, local.areaId, local.regionId, local.zoneId, emirates, areas, abuDhabiAreas, regions, zones]);

  // Handler to confirm and apply the map selection
  const handleConfirmSelection = React.useCallback(() => {
    if (!pendingSelection) return;

    // Use raw Onwani map response instead of database plot response
    const onwaniData = pendingSelection.onwaniMapResponse;
    if (!onwaniData) {
      console.warn("AddressPicker: No Onwani map data available", pendingSelection);
      return;
    }

    // Extract data from Onwani response structure
    const plotAddr = onwaniData.PlotAddress;
    const onwaniAddr = onwaniData.OnwaniAddress;
    const inputCoords = onwaniData.InputCoordinates;

    // Extract coordinates
    const nextLatitude = toFiniteNumber(inputCoords.Lat) || toFiniteNumber(onwaniAddr?.Lat);
    const nextLongitude = toFiniteNumber(inputCoords.Lng) || toFiniteNumber(onwaniAddr?.Lng);
    
    // Extract plot data from Onwani response (prefer PlotAddress, fallback to OnwaniAddress)
    const gisid = plotAddr?.GISID || onwaniAddr?.GISID;
    const plotNumber = plotAddr?.PLOTNUMBER || pendingSelection.plot;
    const roadId = plotAddr?.ROADID || pendingSelection.roadId;
    const communityEn = plotAddr?.COMMUNITYENG || onwaniAddr?.COMMUNITYENG;
    const communityAr = plotAddr?.COMMUNITYARA || onwaniAddr?.COMMUNITYARA;
    const districtEn = plotAddr?.DISTRICTENG || onwaniAddr?.DISTRICTENG;
    const districtAr = plotAddr?.DISTRICTARA || onwaniAddr?.DISTRICTARA;
    const municipalityEn = plotAddr?.MUNICIPALITYENG || onwaniAddr?.MUNICIPALITYENG;
    const municipalityAr = plotAddr?.MUNICIPALITYARA || onwaniAddr?.MUNICIPALITYARA;

    // Determine Abu Dhabi emirate from municipality name
    const isThisSelectionAbuDhabi = (() => {
      const muni = (municipalityEn || "").toLowerCase().trim();
      const muniAr = (municipalityAr || "").trim();
      // Abu Dhabi emirate includes: "Abu Dhabi", "Al Ain", "Al Dhafra" / "Western"
      return muni.includes("abu dhabi") || muni.includes("al ain") || muni === "ain" || 
             muni.includes("dhafra") || muni.includes("western") ||
             muniAr.includes("أبوظبي") || muniAr.includes("العين") || muniAr.includes("الظفرة");
    })();

    const updates: Partial<AddressValue> = {
      emirateId: local.emirateId, // Keep current emirate ID from dropdown
      longitude: nextLongitude,
      latitude: nextLatitude,
      mainPlotId: gisid || null,
      premisesPlotId: null,
    };

    // Store the full address from Onwani
    updates.fullAddressEn = pendingSelection.addressValueEn || onwaniData.AddressValue_EN || null;
    updates.fullAddressAr = pendingSelection.addressValueAr || onwaniData.AddressValue_AR || null;

    // Store municipality names (used for City display)
    updates.municipalityNameEn = municipalityEn || null;
    updates.municipalityNameAr = municipalityAr || null;

    if (isThisSelectionAbuDhabi) {
      // Abu Dhabi: Store District as Region Name, Community as Zone/Area Name
      updates.regionNameEn = districtEn || null;
      updates.regionNameAr = districtAr || null;
      updates.zoneNameEn = communityEn || null;
      updates.zoneNameAr = communityAr || null;
      updates.areaNameEn = communityEn || null; // Often same as zone for Onwani
      updates.areaNameAr = communityAr || null;
      updates.streetName = roadId || undefined;
      updates.houseNumber = plotNumber || undefined;
    } else {
      // Other Emirates: Only basic data
      updates.areaNameEn = communityEn || null;
      updates.areaNameAr = communityAr || null;
      updates.streetName = roadId || undefined;
      updates.houseNumber = plotNumber || undefined;
      // Clear Abu Dhabi specific fields
      updates.regionId = undefined;
      updates.zoneId = undefined;
      updates.plotId = undefined;
      updates.regionNameEn = null;
      updates.regionNameAr = null;
      updates.zoneNameEn = null;
      updates.zoneNameAr = null;
    }

    emit(updates);
    setHasMapSelection(true);
    setLastConfirmedSelection(pendingSelection); // Store for reopening
    setIsMapDialogOpen(false);
    setPendingSelection(null);
  }, [pendingSelection, emit, local.emirateId, setHasMapSelection, setIsMapDialogOpen, setPendingSelection]);

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

  const defaultZoneLabel = isRTL ? "النطاق" : "Zone";
  const zonePlaceholder = zonesLoading
    ? t.pickLocation.loading
    : lockAbuDhabiFields && (local.zoneNameAr || local.zoneNameEn)
      ? (isRTL
          ? local.zoneNameAr ?? local.zoneNameEn ?? defaultZoneLabel
          : local.zoneNameEn ?? local.zoneNameAr ?? defaultZoneLabel)
      : defaultZoneLabel;

  const defaultAreaLabel = l.area;
  const areaPlaceholder = abuDhabiAreasLoading
    ? t.pickLocation.loading
    : lockAbuDhabiFields && (local.areaNameAr || local.areaNameEn)
      ? (isRTL
          ? local.areaNameAr ?? local.areaNameEn ?? defaultAreaLabel
          : local.areaNameEn ?? local.areaNameAr ?? defaultAreaLabel)
      : defaultAreaLabel;

  const wrapperClassName = cn(
    "space-y-6 bg-card rounded-xl p-6 border border-border/50 shadow-sm",
    layout === "grid" ? "" : "",
    className
  );

  return (
    <div className={wrapperClassName} dir={isRTL ? "rtl" : "ltr"}>
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
          value={
            local.emirateId !== undefined && local.emirateId !== null
              ? String(local.emirateId)
              : undefined
          }
          onValueChange={(v) => {
            const id = Number(v);
            emit({
              emirateId: id,
              areaId: undefined,
              regionId: undefined,
              zoneId: undefined,
              plotId: undefined,
              streetName: undefined,
              houseNumber: undefined,
              longitude: undefined,
              latitude: undefined,
              emirateNameEn: null,
              emirateNameAr: null,
              areaNameEn: null,
              areaNameAr: null,
              regionNameEn: null,
              regionNameAr: null,
              zoneNameEn: null,
              zoneNameAr: null,
            });
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
      {/* Emirate-specific field layouts */}
      {!isAbuDhabiSelected && (
        <DubaiNorthernEmiratesFields
          local={local}
          emit={emit}
          disabled={disabled}
          touched={touched}
          setTouched={setTouched}
          areas={areas}
          areasLoading={areasLoading}
          emiratesLoading={emiratesLoading}
          areaError={!!areaError}
          streetError={!!streetError}
          houseError={!!houseError}
          l={l}
          req={req}
          isRTL={isRTL}
          locale={locale}
          t={t}
        />
      )}

      {isAbuDhabiSelected && (
        <AbuDhabiEmirateFields
          local={local}
          emit={emit}
          disabled={disabled}
          hasMapSelection={hasMapSelection}
          setIsMapDialogOpen={setIsMapDialogOpen}
          pendingSelection={pendingSelection}
          regions={regions}
          zones={zones}
          abuDhabiAreas={abuDhabiAreas}
          regionsLoading={regionsLoading}
          zonesLoading={zonesLoading}
          abuDhabiAreasLoading={abuDhabiAreasLoading}
          lockAbuDhabiFields={lockAbuDhabiFields}
          touched={touched}
          setTouched={setTouched}
          regionPlaceholder={""}
          zonePlaceholder={""}
          areaPlaceholder={""}
          isRTL={isRTL}
          locale={locale}
          t={t}
        />
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
                  onReset={() => setPendingSelection(null)}
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
                  const onwaniData = pendingSelection.onwaniMapResponse;
                  const plotAddr = onwaniData?.PlotAddress;
                  const onwaniAddr = onwaniData?.OnwaniAddress;
                  const hasOnwaniData = !!onwaniData;
                  
                  return (
                    <div className="p-4 space-y-3">
                      {/* Full Addresses */}
                      {(onwaniData?.AddressValue_EN || onwaniData?.AddressValue_AR) && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-2">
                          {onwaniData.AddressValue_EN && (
                            <div>
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">
                                {locale === "ar" ? "العنوان (English)" : "Address (English)"}
                              </p>
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
                                {onwaniData.AddressValue_EN}
                              </p>
                            </div>
                          )}
                          {onwaniData.AddressValue_AR && (
                            <div>
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">
                                {locale === "ar" ? "العنوان (عربي)" : "Address (Arabic)"}
                              </p>
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed" dir="rtl">
                                {onwaniData.AddressValue_AR}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Basic Selection Info */}
                      <div className="space-y-2.5">
                        {/* Municipality */}
                        {(plotAddr?.MUNICIPALITYENG || onwaniAddr?.MUNICIPALITYENG) && (
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-aegreen-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {locale === "ar" ? "البلدية" : "Municipality"}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                                {locale === "ar" 
                                  ? plotAddr?.MUNICIPALITYARA || onwaniAddr?.MUNICIPALITYARA || plotAddr?.MUNICIPALITYENG || onwaniAddr?.MUNICIPALITYENG
                                  : plotAddr?.MUNICIPALITYENG || onwaniAddr?.MUNICIPALITYENG}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* District */}
                        {(plotAddr?.DISTRICTENG || onwaniAddr?.DISTRICTENG || pendingSelection.districtEn) && (
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-aegreen-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {locale === "ar" ? "المنطقة" : "District"}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                                {locale === "ar"
                                  ? plotAddr?.DISTRICTARA || onwaniAddr?.DISTRICTARA || plotAddr?.DISTRICTENG || onwaniAddr?.DISTRICTENG || pendingSelection.districtEn
                                  : plotAddr?.DISTRICTENG || onwaniAddr?.DISTRICTENG || pendingSelection.districtEn}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Community */}
                        {(plotAddr?.COMMUNITYENG || onwaniAddr?.COMMUNITYENG || pendingSelection.communityEn) && (
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-aegreen-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {locale === "ar" ? "المجمع السكني" : "Community"}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                                {locale === "ar"
                                  ? plotAddr?.COMMUNITYARA || onwaniAddr?.COMMUNITYARA || plotAddr?.COMMUNITYENG || onwaniAddr?.COMMUNITYENG || pendingSelection.communityEn
                                  : plotAddr?.COMMUNITYENG || onwaniAddr?.COMMUNITYENG || pendingSelection.communityEn}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detailed Onwani Response - Show if we have any Onwani data */}
                      {hasOnwaniData && (plotAddr || onwaniAddr) && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-aegreen-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {locale === "ar" ? "تفاصيل العنوان من Onwani" : "Onwani Address Details"}
                            </h5>
                          </div>

                          {/* Plot/Address Information from Onwani */}
                          {(plotAddr || onwaniAddr) && (
                            <div className="bg-aegreen-50 dark:bg-aegreen-950/30 rounded-lg p-3 border border-aegreen-200/50 dark:border-aegreen-800/50 space-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-aegreen-700 dark:text-aegreen-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <h6 className="text-xs font-bold text-aegreen-900 dark:text-aegreen-300">
                                  {locale === "ar" ? "معلومات التفصيلية" : "Detailed Information"}
                                </h6>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {(plotAddr?.GISID || onwaniAddr?.GISID) && (
                                  <div>
                                    <p className="text-[10px] text-aegreen-700 dark:text-aegreen-400 uppercase tracking-wide">
                                      GISID
                                    </p>
                                    <p className="font-bold text-base text-aegreen-900 dark:text-aegreen-200">
                                      {plotAddr?.GISID || onwaniAddr?.GISID}
                                    </p>
                                  </div>
                                )}
                                {plotAddr?.PLOTNUMBER && (
                                  <div>
                                    <p className="text-[10px] text-aegreen-700 dark:text-aegreen-400 uppercase tracking-wide">
                                      {locale === "ar" ? "رقم القطعة" : "Plot Number"}
                                    </p>
                                    <p className="font-semibold text-aegreen-900 dark:text-aegreen-200">{plotAddr.PLOTNUMBER}</p>
                                  </div>
                                )}
                                {plotAddr?.ROADID && (
                                  <div>
                                    <p className="text-[10px] text-aegreen-700 dark:text-aegreen-400 uppercase tracking-wide">
                                      {locale === "ar" ? "رقم الطريق" : "Road ID"}
                                    </p>
                                    <p className="font-semibold text-aegreen-900 dark:text-aegreen-200">{plotAddr.ROADID}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Coordinates */}
                          {onwaniData.InputCoordinates && (onwaniData.InputCoordinates.Lat || onwaniData.InputCoordinates.Lng) && (
                            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200/50 dark:border-orange-800/50 space-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-700 dark:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <h6 className="text-xs font-bold text-orange-900 dark:text-orange-300">
                                  {locale === "ar" ? "الإحداثيات" : "Coordinates"}
                                </h6>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {onwaniData.InputCoordinates.Lat && (
                                  <div>
                                    <p className="text-[10px] text-orange-700 dark:text-orange-400 uppercase">
                                      {locale === "ar" ? "خط العرض" : "Latitude"}
                                    </p>
                                    <p className="font-mono font-semibold text-orange-900 dark:text-orange-200 text-[10px]">
                                      {onwaniData.InputCoordinates.Lat}
                                    </p>
                                  </div>
                                )}
                                {onwaniData.InputCoordinates.Lng && (
                                  <div>
                                    <p className="text-[10px] text-orange-700 dark:text-orange-400 uppercase">
                                      {locale === "ar" ? "خط الطول" : "Longitude"}
                                    </p>
                                    <p className="font-mono font-semibold text-orange-900 dark:text-orange-200 text-[10px]">
                                      {onwaniData.InputCoordinates.Lng}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Address Type Badge */}
                          {onwaniData.AddressType && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{locale === "ar" ? "نوع العنوان:" : "Address Type:"}</span>
                              <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">
                                {onwaniData.AddressType}
                              </span>
                            </div>
                          )}
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
      </div>
  );
}

export default AddressPicker;
