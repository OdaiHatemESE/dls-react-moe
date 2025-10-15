"use client";

/**
 * MyLandPicker
 *
 * Purpose
 * - A client component that lets users select an Onwani address (Municipality → District → Community → optional Road (AAM) → Plot).
 * - Shows the MyLand map (embedded via iframe) and keeps UI and map in sync through postMessage.
 *
 * Key data sources
 * - API helpers from `@/lib/onwani-client`: districts, communities, roads (AAM), plot numbers, and GIS details.
 * - Optional overlay shape for selected community (for visualization + possible plot extraction).
 *
 * MAP TRIGGERS (look for these markers)
 * - INBOUND: Single event listener that receives messages from the MyLand iframe and applies preselection/state updates.
 * - OUTBOUND: Several effects and actions post messages to the iframe when:
 *   1) Municipality/District/Community changes
 *   2) Plots are requested or a plot is focused/selected
 *   3) Address coordinates are set
 *   4) Final selection is confirmed
 *
 * Props
 * - defaultMunicipality: initial municipality (ADM, AAM, WRM)
 * - showOverlayShape: whether to fetch and attach a community GeoJSON shape
 * - onOk: called with the final selection (and optional DB response)
 * - onCancel: caller-provided cancel handler
 *
 * Quick edit hints (line ~numbers)
 * - Dropdown defaults and cascading selections → Selection state block (~55)
 * - API fetching for districts/communities/plots → useEffect cascade (~110-220)
 * - Map inbound message parsing → window message handler (~260-420)
 * - Map outbound messaging helpers → sendToIframe + effects (~430-560)
 * - Reset + submission payload tweaks → handlers and handleOk (~600-740)
 */ 

import * as React from "react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { getCommunities, getCommunityShape, getDistricts, getRoadIds, getPlotNumbers, getGisIds } from "@/lib/onwani-client";
import type { Municipality, OnwaniSelection, PlotLookupResponse } from "@/types";

type Props = {
  defaultMunicipality?: Municipality;
  showOverlayShape?: boolean;
  className?: string;
  onOk?: (sel: OnwaniSelection) => void;
  onCancel?: () => void;
};

type NamedOption = { value: string; en: string; ar?: string };
type PlotOption = { label: string; value: string; gisid?: string };

const MYLAND_ALLOWED_ORIGIN = "https://myland.dmt.gov.ae";

const isPlotLookupResponse = (payload: unknown): payload is PlotLookupResponse => {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as PlotLookupResponse;
  return Array.isArray(candidate.data);
};
export default function MyLandPicker({
  defaultMunicipality = "ADM",
  showOverlayShape = false,
  className,
  onOk,
  onCancel,
}: Props) {
  // ---------------------------------------------------------------------------
  // Locale awareness
  // ---------------------------------------------------------------------------
  const { locale } = useI18n();
  const isAr = locale === "ar";

  // ---------------------------------------------------------------------------
  // Selection state
  // ---------------------------------------------------------------------------
  const [municipality, setMunicipality] = React.useState<Municipality>(defaultMunicipality);
  const [districts, setDistricts] = React.useState<NamedOption[]>([]);
  const [district, setDistrict] = React.useState<string | undefined>(undefined);
  const [communities, setCommunities] = React.useState<NamedOption[]>([]);
  const [community, setCommunity] = React.useState<string | undefined>(undefined);
  const [roads, setRoads] = React.useState<string[]>([]);
  const [roadId, setRoadId] = React.useState<string | undefined>(undefined);
  const [plot, setPlot] = React.useState<string>("");
  const [plotOptions, setPlotOptions] = React.useState<PlotOption[]>([]);
  const [shape, setShape] = React.useState<unknown>(undefined);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<{ districts?: boolean; communities?: boolean; roads?: boolean; shape?: boolean }>({});

  // ---------------------------------------------------------------------------
  // Internal refs for async coordination and map sync
  // ---------------------------------------------------------------------------
  const pendingRef = React.useRef<{ district?: string; community?: string; roadId?: string; plot?: string }>({});
  const gisInfoRef = React.useRef<unknown>(undefined);
  const lastCoordsRef = React.useRef<{ lng: string; lat: string } | undefined>(undefined);
  const userInteractedRef = React.useRef<boolean>(false); // Track if user manually changed dropdown
  const isApplyingMapDataRef = React.useRef<boolean>(false); // Prevent loops when applying map data
  const mapSelectionActiveRef = React.useRef<boolean>(false); // Track if current state mirrors a map pin

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // ---------------------------------------------------------------------------
  // Type guards and shape helpers
  // ---------------------------------------------------------------------------
  // Narrowing helper: ensure runtime object checks before plucking fields
  const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
  const toStringIfScalar = (v: unknown): string | undefined =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;

  const getScalar = React.useCallback((obj: unknown, keys: string[]): string | undefined => {
    if (!isRecord(obj)) return undefined;
    for (const k of keys) {
      const s = toStringIfScalar(obj[k]);
      if (s) return s;
    }
    return undefined;
  }, []);

  /**
   * Attempt to derive plot identifiers from a GeoJSON-like shape payload.
   * Returns a sorted list of unique plot numbers/GISIDs best-effort.
   */
  const extractPlotsFromShape = React.useCallback((shapeData: unknown): string[] => {
    // Supports { features: [...] } or { data: { features: [...] } }
    let featuresUnknown: unknown = undefined;
    if (isRecord(shapeData) && Array.isArray((shapeData as { features?: unknown }).features)) {
      featuresUnknown = (shapeData as { features?: unknown }).features;
    } else if (
      isRecord(shapeData) &&
      isRecord((shapeData as { data?: unknown }).data) &&
      Array.isArray(((shapeData as { data?: { features?: unknown } }).data as { features?: unknown }).features)
    ) {
      featuresUnknown = ((shapeData as { data?: { features?: unknown } }).data as { features?: unknown }).features;
    }

    const features = Array.isArray(featuresUnknown) ? featuresUnknown : [];
    const plotKeys = ["GISID", "gisid", "GisId", "PLOTNUMBER", "plotNumber", "PLOT_NUMBER", "PLOTNUM"] as const;
    const plots = new Set<string>();
    for (const f of features) {
      const props = isRecord(f) && isRecord((f as { properties?: unknown }).properties)
        ? ((f as { properties?: Record<string, unknown> }).properties as Record<string, unknown>)
        : undefined;
      if (!props) continue;
      for (const key of plotKeys) {
        const maybeVal = props[key];
        const str = toStringIfScalar(maybeVal);
        if (str) {
          plots.add(str);
          break;
        }
      }
    }
    return Array.from(plots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, []);

  /**
   * Normalize various plot list API responses into {label,value,gisid} options.
   * Tries to keep the most descriptive label and deduplicate values.
   */
  const extractPlotsFromAPI = React.useCallback((data: unknown): PlotOption[] => {
    // API may return an array or { data: [...] }
    const root = data as unknown;
    const arr = Array.isArray(root)
      ? root
      : typeof root === "object" && root !== null && Array.isArray((root as { data?: unknown[] }).data)
      ? ((root as { data: unknown[] }).data as unknown[])
      : [];
    const out: PlotOption[] = [];
    for (const item of arr) {
      if (!(typeof item === "object" && item !== null)) continue;
      const rec = item as Record<string, unknown>;
      const plotNumber =
        toStringIfScalar(rec["PLOTNUMBER"]) ||
        toStringIfScalar(rec["plotNumber"]) ||
        toStringIfScalar(rec["PLOT_NUMBER"]) ||
        toStringIfScalar(rec["PLOTNUM"]) ||
        toStringIfScalar(rec["Plot"]) ||
        toStringIfScalar(rec["plot"]) ||
        undefined;
      const gisid =
        toStringIfScalar(rec["GISID"]) ||
        toStringIfScalar(rec["gisid"]) ||
        toStringIfScalar(rec["GisId"]) ||
        toStringIfScalar(rec["GIS_ID"]) ||
        toStringIfScalar(rec["gis_id"]) ||
        toStringIfScalar(rec["GIS_ID_NO"]) ||
        toStringIfScalar(rec["GIS_NO"]) ||
        undefined;
      const label = plotNumber ?? gisid;
      const value = plotNumber ?? gisid;
      if (label && value) out.push({ label, value, gisid });
    }
    // Sort by label naturally
    return out
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
      .filter((opt, idx, arr2) => arr2.findIndex((o) => o.value === opt.value) === idx);
  }, []);

  /**
   * Merge newly discovered plot options with existing ones while preserving
   * the option that contains a GISID and the more descriptive label.
   */
  const mergePlotOptions = React.useCallback((prev: PlotOption[], next: PlotOption[]): PlotOption[] => {
    const map = new Map<string, PlotOption>();
    for (const o of prev) map.set(o.value, o);
    for (const n of next) {
      const existing = map.get(n.value);
      if (!existing) {
        map.set(n.value, n);
      } else {
        // Prefer entry that has a gisid, and keep the more descriptive label if present
        map.set(n.value, {
          value: n.value,
          label: existing.label?.length >= (n.label?.length ?? 0) ? existing.label : n.label,
          gisid: existing.gisid ?? n.gisid,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, []);

  // Fetch districts on municipality change
  React.useEffect(() => {
    let cancelled = false;
    setLoading((l) => ({ ...l, districts: true }));
    // Only reset downstream if user changed municipality manually
    if (userInteractedRef.current) {
      setDistrict(undefined);
      setCommunities([]);
      setCommunity(undefined);
      setRoads([]);
      setRoadId(undefined);
      setPlot("");
      setPlotOptions([]);
    }
    getDistricts(municipality)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : // some endpoints wrap in object
            (data?.data ?? []);
        const opts: NamedOption[] = (list as Array<Record<string, unknown>>)
          .map((d: Record<string, unknown>) => {
            const en =
              toStringIfScalar(d["DISTRICT_NAME_EN"]) ||
              toStringIfScalar(d["district_name_en"]) ||
              toStringIfScalar(d["DISTRICTENG"]) ||
              undefined;
            const ar =
              toStringIfScalar(d["DISTRICT_NAME_AR"]) ||
              toStringIfScalar(d["district_name_ar"]) ||
              toStringIfScalar(d["DISTRICTAR"]) ||
              toStringIfScalar(d["DISTRICT_NAME_ARABIC"]) ||
              undefined;
            if (!en) return undefined;
            return { value: en, en, ar } as NamedOption;
          })
          .filter((v: NamedOption | undefined): v is NamedOption => !!v);
        setDistricts(opts);
      })
      .catch(() => setDistricts([]))
      .finally(() => !cancelled && setLoading((l) => ({ ...l, districts: false })));
    return () => {
      cancelled = true;
    };
  }, [municipality]);

  // Fetch communities when district changes
  React.useEffect(() => {
    if (!district) return;
    let cancelled = false;
    setLoading((l) => ({ ...l, communities: true }));
    setCommunities([]);
    // Only reset downstream if user changed district manually
    if (userInteractedRef.current) {
      setCommunity(undefined);
      setRoads([]);
      setRoadId(undefined);
      setPlot("");
      setPlotOptions([]);
    }
    getCommunities(municipality, district)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        const opts: NamedOption[] = (list as Array<Record<string, unknown>>)
          .map((c: Record<string, unknown>) => {
            const en =
              toStringIfScalar(c["COMMUNITY_NAME_EN"]) ||
              toStringIfScalar(c["community_name_en"]) ||
              toStringIfScalar(c["COMMUNITYENG"]) ||
              undefined;
            const ar =
              toStringIfScalar(c["COMMUNITY_NAME_AR"]) ||
              toStringIfScalar(c["community_name_ar"]) ||
              toStringIfScalar(c["COMMUNITYAR"]) ||
              toStringIfScalar(c["COMMUNITY_NAME_ARABIC"]) ||
              undefined;
            if (!en) return undefined;
            return { value: en, en, ar } as NamedOption;
          })
          .filter((v: NamedOption | undefined): v is NamedOption => !!v);
        setCommunities(opts);
      })
      .catch(() => setCommunities([]))
      .finally(() => !cancelled && setLoading((l) => ({ ...l, communities: false })));
    return () => {
      cancelled = true;
    };
  }, [municipality, district]);

  // Fetch road ids (AAM only)
  React.useEffect(() => {
    if (municipality !== "AAM" || !district || !community) return;
    let cancelled = false;
    setLoading((l) => ({ ...l, roads: true }));
    setRoads([]);
    // Only reset downstream if user changed community manually
    if (userInteractedRef.current) {
      setRoadId(undefined);
      setPlot("");
      setPlotOptions([]);
    }
    getRoadIds(district!, community!)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (isRecord(data) && Array.isArray((data as { data?: unknown[] }).data) ? ((data as { data?: unknown[] }).data as unknown[]) : []);
        const keys = ["ROADID"];
        const ids = (list as unknown[])
          .map((item) => {
            // Handle scalar arrays (string/number) as well as object records
            if (typeof item === "string" || typeof item === "number") {
              return String(item);
            }
            if (isRecord(item)) {
              const v = getScalar(item, keys);
              return v ?? undefined;
            }
            return undefined;
          })
          .filter((v): v is string => typeof v === "string" && v.length > 0);
        const uniqueSorted = Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setRoads(uniqueSorted);
      })
      .catch(() => setRoads([]))
      .finally(() => !cancelled && setLoading((l) => ({ ...l, roads: false })));
    return () => {
      cancelled = true;
    };
  }, [municipality, district, community, getScalar]);

  // Optional: community shape
  React.useEffect(() => {
    if (!showOverlayShape || !municipality || !district || !community) {
      setShape(undefined);
      return;
    }
    let cancelled = false;
    setLoading((l) => ({ ...l, shape: true }));
    getCommunityShape(municipality, district, community)
      .then((data) => {
        if (!cancelled) {
          setShape(data);
          const plotsFromShape = extractPlotsFromShape(data);
          if (plotsFromShape.length) {
            const shapeOpts: PlotOption[] = plotsFromShape.map((p) => ({ label: p, value: p }));
            setPlotOptions((prev) => mergePlotOptions(prev, shapeOpts));
          }
        }
      })
      .catch(() => !cancelled && setShape(undefined))
      .finally(() => !cancelled && setLoading((l) => ({ ...l, shape: false })));
    return () => {
      cancelled = true;
    };
  }, [showOverlayShape, municipality, district, community, extractPlotsFromShape, mergePlotOptions]);

  // Fetch plot numbers via API whenever community (and municipality/district) is ready
  React.useEffect(() => {
    if (!municipality || !district || !community) return;
    let cancelled = false;
    // For AAM, include roadId if selected to filter plots
    getPlotNumbers(municipality, district, community, municipality === "AAM" ? roadId : undefined)
      .then((data) => {
        if (cancelled) return;
        const apiOptions = extractPlotsFromAPI(data);
        if (apiOptions.length) {
          setPlotOptions((prev) => mergePlotOptions(prev, apiOptions));
        }
      })
      .catch(() => {
        // ignore errors; UI will rely on iframe or shape fallback
      });
    return () => {
      cancelled = true;
    };
  }, [municipality, district, community, roadId, extractPlotsFromAPI, mergePlotOptions]);

  const tryApplyPending = React.useCallback(() => {
    const pending = pendingRef.current;
    const normalize = (val?: string) => (val ?? "").trim().toLowerCase();

    if (pending.district) {
      const target = normalize(pending.district);
      const match = districts.find((o) => {
        const valueMatch = normalize(o.value) === target;
        const enMatch = normalize(o.en) === target;
        const arMatch = typeof o.ar === "string" && normalize(o.ar) === target;
        return valueMatch || enMatch || arMatch;
      });
      if (!match) return;
      if (normalize(district) !== target) {
        console.log("🔄 Applying pending district:", match.value);
        isApplyingMapDataRef.current = true;
        userInteractedRef.current = false;
        setDistrict(match.value);
        pending.district = undefined;
        setTimeout(() => {
          isApplyingMapDataRef.current = false;
        }, 0);
        return;
      }
      pending.district = undefined;
    }

    if (pending.community) {
      const target = normalize(pending.community);
      const match = communities.find((o) => {
        const valueMatch = normalize(o.value) === target;
        const enMatch = normalize(o.en) === target;
        const arMatch = typeof o.ar === "string" && normalize(o.ar) === target;
        return valueMatch || enMatch || arMatch;
      });
      if (!match) return;
      if (normalize(community) !== target) {
        console.log("🔄 Applying pending community:", match.value);
        isApplyingMapDataRef.current = true;
        userInteractedRef.current = false;
        setCommunity(match.value);
        pending.community = undefined;
        setTimeout(() => {
          isApplyingMapDataRef.current = false;
        }, 0);
        return;
      }
      pending.community = undefined;
    }

    if (pending.roadId) {
      const target = normalize(pending.roadId);
      const match = roads.find((r) => normalize(r) === target);
      if (!match) return;
      if (normalize(roadId) !== target) {
        console.log("🔄 Applying pending road:", match);
        isApplyingMapDataRef.current = true;
        userInteractedRef.current = false;
        setRoadId(match);
        pending.roadId = undefined;
        setTimeout(() => {
          isApplyingMapDataRef.current = false;
        }, 0);
        return;
      }
      pending.roadId = undefined;
    }

    if (pending.plot) {
      const target = normalize(pending.plot);
      const match = plotOptions.find((o) => {
        const valueMatch = normalize(o.value) === target;
        const labelMatch = normalize(o.label) === target;
        return valueMatch || labelMatch;
      });
      if (!match) return;
      if (normalize(plot) !== target) {
        console.log("🔄 Applying pending plot:", match.value);
        isApplyingMapDataRef.current = true;
        userInteractedRef.current = false;
        setPlot(match.value);
        pending.plot = undefined;
        setTimeout(() => {
          isApplyingMapDataRef.current = false;
        }, 0);
        return;
      }
      pending.plot = undefined;
    }
  }, [districts, communities, roads, plotOptions, district, community, roadId, plot]);

  // MAP TRIGGER (INBOUND): postMessage handler with origin check + preselection
  // - Receives messages from MyLand iframe and applies state based on payload
  React.useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== MYLAND_ALLOWED_ORIGIN) return;
      // Expected patterns (subject to real MyLand schema):
      // { type: "plot-list", payload: { plots: string[] } }
      // { type: "plot-selected", payload: { plot: string } }
      // Or Angular-like payload with AddressType: 'Onwani' | 'Plot'
      try {
        let data = ev.data as unknown;
        if (typeof data === "string") {
          const trimmed = data.trim();
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            try {
              data = JSON.parse(trimmed) as unknown;
            } catch {
              // leave as string if JSON.parse fails
            }
          } else if (trimmed.includes("{")) {
            const start = trimmed.indexOf("{");
            const maybeJson = trimmed.slice(start);
            try {
              data = JSON.parse(maybeJson) as unknown;
            } catch {
              // not JSON, keep original string
            }
          }
        }

        console.log("📩 MyLand message received", data);

        if (
          typeof data === "object" &&
          data !== null &&
          "type" in (data as Record<string, unknown>)
        ) {
          const t = (data as Record<string, unknown>)["type"];
          if (t === "plot-list") {
            const payload = (data as Record<string, unknown>)["payload"] as Record<string, unknown> | undefined;
            const plots = Array.isArray(payload?.plots)
              ? (payload!.plots as unknown[]).filter((p): p is string => typeof p === "string")
              : [];
            const newOpts: PlotOption[] = plots.map((p) => ({ label: p, value: p }));
            setPlotOptions(newOpts);
            // clear selected plot if it's not in the new list
            setPlot((prev) => (newOpts.some((o) => o.value === prev || o.label === prev) ? prev : ""));
          } else if (t === "plot-selected") {
            const payload = (data as Record<string, unknown>)["payload"] as Record<string, unknown> | undefined;
            const p = typeof payload?.plot === "string" ? (payload!.plot as string) : undefined;
            const gid =
              (typeof payload?.GISID === "string" && (payload!.GISID as string)) ||
              (typeof payload?.gisid === "string" && (payload!.gisid as string)) ||
              undefined;
            if (p) {
              setPlot(p);
              if (gid) {
                // attach GISID to the matching option, or add it if missing
                setPlotOptions((prev) => {
                  let found = false;
                  const updated = prev.map((o) => {
                    if (o.value === p || o.label === p) {
                      found = true;
                      return { ...o, gisid: o.gisid ?? gid };
                    }
                    return o;
                  });
                  if (!found) updated.push({ label: p, value: p, gisid: gid });
                  return updated;
                });
              }
            }
          }
        } else if (typeof data === "object" && data !== null && (data as Record<string, unknown>)["AddressType"]) {
          const d = data as Record<string, unknown>;
          const addressType = typeof d.AddressType === "string" ? (d.AddressType as string) : undefined;
          const normalizedType = addressType?.toLowerCase();
          const handledTypes = ["onwani", "plot", "pin", "pindrop", "coordinates", "coordinate"];
          if (normalizedType && handledTypes.includes(normalizedType)) {
            console.log("📍 Map pin placed - applying address data:", d);
            
            // Mark that we're applying map data to prevent loops
            isApplyingMapDataRef.current = true;
            userInteractedRef.current = false; // Map action, not user
            mapSelectionActiveRef.current = true;
            
            const addrEn = typeof d.AddressValue_EN === "string" ? (d.AddressValue_EN as string) : "";
            const parts = addrEn.split(",").map((s) => s.trim()).filter(Boolean);
            const municipalityName = parts[parts.length - 1] ?? "";
            const onwaniAddr = isRecord(d.OnwaniAddress) ? (d.OnwaniAddress as Record<string, unknown>) : undefined;
            const plotAddr = isRecord(d.PlotAddress) ? (d.PlotAddress as Record<string, unknown>) : undefined;

            const municipalityCandidate =
              toStringIfScalar(onwaniAddr?.MUNICIPALITYENG) ||
              toStringIfScalar(plotAddr?.MUNICIPALITYENG) ||
              municipalityName;
            const toMunicipalityCode = (input?: string): Municipality => {
              const val = (input ?? "").toLowerCase().replace(/\s+/g, " ").trim();
              if (val.includes("abu dhabi")) return "ADM";
              if (val.includes("al ain") || val === "ain" || val === "alain") return "AAM";
              if (val.includes("dhaf") || val.includes("western")) return "WRM";
              return "ADM";
            };

            const districtCandidate =
              toStringIfScalar(onwaniAddr?.DISTRICTENG) ||
              toStringIfScalar(plotAddr?.DISTRICTENG) ||
              (parts.length > 1 ? parts[parts.length - 2] : undefined);
            const communityCandidate =
              toStringIfScalar(onwaniAddr?.COMMUNITYENG) ||
              toStringIfScalar(plotAddr?.COMMUNITYENG) ||
              (parts.length > 2 ? parts[parts.length - 3] : undefined);
            const plotNo =
              toStringIfScalar(onwaniAddr?.GISID) ||
              toStringIfScalar(plotAddr?.GISID) ||
              getScalar(plotAddr, ["PLOTNUMBER", "plotNumber", "PLOT_NUMBER", "PLOTNUM", "Plot", "plot"]);

            // Capture coordinates for fallback use
            const inputCoords = isRecord(d["InputCoordinates"]) ? (d["InputCoordinates"] as Record<string, unknown>) : undefined;
            const lng = getScalar(onwaniAddr, ["Lng", "lng", "Longitude", "longitude"]) || getScalar(inputCoords, ["Lng", "lng"]);
            const lat = getScalar(onwaniAddr, ["Lat", "lat", "Latitude", "latitude"]) || getScalar(inputCoords, ["Lat", "lat"]);
            if (lng && lat) {
              lastCoordsRef.current = { lng, lat };
            }

            // Map municipality text to code
            const m: Municipality = municipalityCandidate ? toMunicipalityCode(municipalityCandidate) : municipality;

            // Derive AAM road id
            let derivedRoad: string | undefined;
            if (m === "AAM") {
              if (normalizedType === "onwani" && typeof onwaniAddr?.PlotAddress === "string") {
                const segs = (onwaniAddr.PlotAddress as string).split("-");
                derivedRoad = segs.length >= 2 ? segs[segs.length - 2] : undefined;
              }
              if (!derivedRoad) {
                derivedRoad = getScalar(plotAddr, ["ROADID", "RoadId", "roadId"]);
              }
            }

            // Store pending to apply once lists are ready
            pendingRef.current = {
              district: districtCandidate?.trim() || undefined,
              community: communityCandidate?.trim() || undefined,
              roadId: derivedRoad?.trim() || undefined,
              plot: plotNo?.trim(),
            };

            if (plotNo) {
              const normalizedPlot = plotNo.trim();
              setPlot(normalizedPlot);
              setPlotOptions((prev) => mergePlotOptions(prev, [{ label: normalizedPlot, value: normalizedPlot }]));
            }

            console.log("📦 Pending selections queued:", pendingRef.current);

            // Kick off cascade by setting municipality (forces district refetch when it changes)
            if (municipality !== m) {
              setMunicipality(m);
            }

            // Attempt immediate application using current option lists
            tryApplyPending();

            // Reset flag after cascade completes (allow time for all effects to run)
            setTimeout(() => {
              isApplyingMapDataRef.current = false;
              console.log("✅ Map data application complete - ready for user interaction");
            }, 100);
          }
        }
      } catch {
        // ignore malformed messages
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [getScalar, municipality, mergePlotOptions, tryApplyPending]);

  // MAP TRIGGER (OUTBOUND): helper to send messages to the MyLand iframe safely
  const sendToIframe = React.useCallback(
    (data: unknown) => {
      const frame = iframeRef.current;
      if (frame?.contentWindow) {
        frame.contentWindow.postMessage(data, MYLAND_ALLOWED_ORIGIN);
      }
    },
    []
  );

  const clearMapSelection = React.useCallback(() => {
    const wasActive = mapSelectionActiveRef.current;
    mapSelectionActiveRef.current = false;
    isApplyingMapDataRef.current = false;
    pendingRef.current = {};
    gisInfoRef.current = undefined;
    lastCoordsRef.current = undefined;
    if (wasActive) {
      sendToIframe({ type: "reset-selection" });
      sendToIframe({ type: "reset", action: "clear-selection" });
    }
  }, [sendToIframe]);

  const canSubmit = municipality && district && community && (municipality !== "AAM" || roadId) && plot.trim().length > 0 && !submitting;

  // Handlers for user interactions - these set the flag to allow smart resets
  const handleMunicipalityChange = (v: Municipality) => {
    console.log("👤 User changed municipality to:", v);
    userInteractedRef.current = true;
    clearMapSelection();
    setMunicipality(v);
    setDistrict(undefined);
    setDistricts([]);
    setCommunities([]);
    setCommunity(undefined);
    setRoads([]);
    setRoadId(undefined);
    setPlot("");
    setPlotOptions([]);
    setShape(undefined);
  };

  const handleDistrictChange = (v: string | undefined) => {
    console.log("👤 User changed district to:", v);
    userInteractedRef.current = true;
    clearMapSelection();
    setDistrict(v);
    setCommunity(undefined);
    setCommunities([]);
    setRoads([]);
    setRoadId(undefined);
    setPlot("");
    setPlotOptions([]);
    setShape(undefined);
  };

  const handleCommunityChange = (v: string | undefined) => {
    console.log("👤 User changed community to:", v);
    userInteractedRef.current = true;
    clearMapSelection();
    setCommunity(v);
    setRoads([]);
    setRoadId(undefined);
    setPlot("");
    setPlotOptions([]);
    setShape(undefined);
  };

  const handleRoadChange = (v: string | undefined) => {
    console.log("👤 User changed road to:", v);
    userInteractedRef.current = true;
    clearMapSelection();
    setRoadId(v);
    setPlot("");
    setPlotOptions([]);
  };

  const handlePlotChange = (v: string) => {
    console.log("👤 User changed plot to:", v);
    userInteractedRef.current = true;
    clearMapSelection();
    setPlot(v);
  };

  const handleReset = () => {
    userInteractedRef.current = true;
    clearMapSelection();
    // Reset to initial state - clear all data and selections
    setMunicipality(defaultMunicipality);
    setDistricts([]); // Clear districts data
    setDistrict(undefined);
    setCommunities([]); // Clear communities data
    setCommunity(undefined);
    setRoads([]); // Clear roads data
    setRoadId(undefined);
    setPlot("");
    setPlotOptions([]); // Clear plot options
    setShape(undefined); // Clear shape data
    pendingRef.current = {};
    mapSelectionActiveRef.current = false;
    lastCoordsRef.current = undefined;
    gisInfoRef.current = undefined;
    // Notify map to reset/clear
    sendToIframe({ type: "reset", action: "clear" });
  };

  const handleOk = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Prefer GISID when available, fallback to selected plot value
      const selected = plotOptions.find((o) => o.value === plot || o.label === plot);
      const gisid = selected?.gisid ?? plot;
      // Call backend API to fetch plot mapping/details by GISID
      const res = await fetch(`/api/db/plots?filter=${encodeURIComponent(gisid)}`, { cache: "no-store" });
      let dbPayload: unknown = undefined;
      try {
        dbPayload = await res.json();
      } catch {
        // ignore parse errors; keep undefined
      }
      // You can choose to surface errors to the UI if needed
      if (!res.ok) {
        console.error("GetPlot API error", dbPayload);
      }
      const payload: OnwaniSelection = {
        municipality,
        districtEn: district!,
        communityEn: community!,
        roadId: municipality === "AAM" ? roadId : undefined,
        plot: plot.trim() || undefined,
        shapeGeoJSON: shape,
      };
      // Attach typed API payload when available so forms can auto-fill hierarchy data.
      if (res.ok && isPlotLookupResponse(dbPayload)) {
        payload.dbPlotResponse = dbPayload;
      }
      onOk?.(payload);
      // MAP TRIGGER (OUTBOUND): notify iframe of the finalized selection
      sendToIframe({ type: "onwani-selection", payload });
    } finally {
      setSubmitting(false);
    }
  };

  // MAP TRIGGER (OUTBOUND): When municipality changes, inform iframe (region)
  React.useEffect(() => {
    if (!municipality) return;
    // Don't send to map if we're currently applying map data (prevent loop)
    if (isApplyingMapDataRef.current) return;
    sendToIframe({ set: "region", municipality });
  }, [municipality, sendToIframe]);

  // MAP TRIGGER (OUTBOUND): When district changes, inform iframe (district)
  React.useEffect(() => {
    if (!district) return;
    // Don't send to map if we're currently applying map data (prevent loop)
    if (isApplyingMapDataRef.current) return;
    sendToIframe({ set: "district", municipality, district });
  }, [district, municipality, sendToIframe]);

  // MAP TRIGGER (OUTBOUND): When community changes, set community and request plots
  React.useEffect(() => {
    if (!community) return;
    // Reset plot choices for new context only if user changed community
    if (userInteractedRef.current) {
      setPlot("");
      setPlotOptions([]);
    }
    // Don't send to map if we're currently applying map data (prevent loop)
    if (isApplyingMapDataRef.current) return;
    sendToIframe({ set: "community", municipality, district, community });
    sendToIframe({
      type: "request-plots",
      payload: { municipality, districtEn: district!, communityEn: community!, roadId },
    });
  }, [community, municipality, district, roadId, sendToIframe]);

  // When roadId changes (AAM), clear plot selection and re-request plots
  React.useEffect(() => {
    if (municipality !== "AAM") return;
    if (!community) return;
    // Clear current plot state when switching roads only if user changed road
    if (userInteractedRef.current) {
      setPlot("");
      setPlotOptions([]);
    }
    // Don't send to map if we're currently applying map data (prevent loop)
    if (isApplyingMapDataRef.current) return;
    // Ask iframe to refresh plots for selected road
    sendToIframe({
      type: "request-plots",
      payload: { municipality, districtEn: district!, communityEn: community!, roadId },
    });
  }, [municipality, district, community, roadId, sendToIframe]);

  // MAP TRIGGER (OUTBOUND): Focus/zoom map after a plot is selected and set address coordinates
  React.useEffect(() => {
    if (!plot) return;
    if (!district || !community) return;
    // Don't send to map if we're currently applying map data (prevent loop)
    if (isApplyingMapDataRef.current) return;
    
    const selected = plotOptions.find((o) => o.value === plot || o.label === plot);
    const gisid = selected?.gisid;
    // Inform viewers: focus and set plot
    const payload: Record<string, unknown> = { municipality, districtEn: district, communityEn: community, roadId, plotNumber: plot, plot };
    if (gisid) payload.GISID = gisid;
    sendToIframe({ type: "focus-plot", payload });
    const idForPlot = gisid ?? plot;
    if (gisid) {
      sendToIframe({ type: "focus-gisid", payload: { GISID: gisid } });
    }
    // Angular-like: set plot with lowercase gisid exactly (use GISID if present, else plot)
    sendToIframe({ set: "plot", gisid: idForPlot });
    // Fetch GISID details then set explicit address coordinates
    getGisIds(idForPlot)
        .then((data) => {
          gisInfoRef.current = data;
          const root = data as unknown;
          const arrUnknown: unknown[] = Array.isArray(root)
            ? (root as unknown[])
            : isRecord(root) && Array.isArray((root as { data?: unknown[] }).data)
            ? (((root as { data?: unknown[] }).data as unknown[]) || [])
            : [];
          const first = arrUnknown.length > 0 && isRecord(arrUnknown[0]) ? (arrUnknown[0] as Record<string, unknown>) : undefined;
          const lng = getScalar(first, ["Lng", "lng", "Longitude", "longitude"]);
          const lat = getScalar(first, ["Lat", "lat", "Latitude", "latitude"]);
          if (lng && lat) {
            sendToIframe({ set: "address", address: `${lng},${lat}` });
          } else if (lastCoordsRef.current) {
            sendToIframe({ set: "address", address: `${lastCoordsRef.current.lng},${lastCoordsRef.current.lat}` });
          }
        })
        .catch(() => {
          // If details fail, fallback to last known coords if available
          if (lastCoordsRef.current) {
            sendToIframe({ set: "address", address: `${lastCoordsRef.current.lng},${lastCoordsRef.current.lat}` });
          }
    });
  }, [plot, municipality, district, community, roadId, sendToIframe, plotOptions, getScalar]);

  // Apply pending selections when options arrive
  React.useEffect(() => {
    tryApplyPending();
  }, [districts, communities, roads, plotOptions, tryApplyPending]);

  return (
    <Card className={cn("w-full border shadow-lg bg-card", className)}>
      <CardHeader className="border-b bg-muted/50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">{isAr ? "اختيار العنوان (Onwani)" : "Onwani Address Picker"}</span>
          <div className="flex gap-2">
            <Select value={municipality} onValueChange={handleMunicipalityChange}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Municipality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADM">{isAr ? "أبوظبي" : "Abu Dhabi"}</SelectItem>
                <SelectItem value="AAM">{isAr ? "العين" : "Al Ain"}</SelectItem>
                <SelectItem value="WRM">{isAr ? "الغربية" : "Al Dhafra"}</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleReset}
              className="min-w-[80px]"
              title={isAr ? "إعادة تعيين الكل" : "Reset all"}
            >
              {isAr ? "إعادة تعيين" : "Reset"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Cascading selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground/80">{isAr ? "المنطقة" : "District"}</label>
            <Combobox
              options={districts.map((d) => ({ 
                value: d.value, 
                label: isAr ? d.ar ?? d.en : d.en,
                searchTerms: isAr ? d.en : d.ar // Allow searching in the other language
              }))}
              value={district}
              onValueChange={handleDistrictChange}
              disabled={loading.districts}
              placeholder={loading.districts ? (isAr ? "جارٍ التحميل.." : "Loading...") : isAr ? "اختر المنطقة" : "Select district"}
              searchPlaceholder={isAr ? "ابحث عن المنطقة..." : "Search district..."}
              emptyText={isAr ? "لم يتم العثور على نتائج" : "No results found"}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground/80">{isAr ? "المجتمع" : "Community"}</label>
            <Combobox
              options={communities.map((c) => ({ 
                value: c.value, 
                label: isAr ? c.ar ?? c.en : c.en,
                searchTerms: isAr ? c.en : c.ar // Allow searching in the other language
              }))}
              value={community}
              onValueChange={handleCommunityChange}
              disabled={!district || loading.communities}
              placeholder={!district ? (isAr ? "اختر المنطقة أولاً" : "Pick district first") : loading.communities ? (isAr ? "جارٍ التحميل.." : "Loading...") : isAr ? "اختر المجتمع" : "Select community"}
              searchPlaceholder={isAr ? "ابحث عن المجتمع..." : "Search community..."}
              emptyText={isAr ? "لم يتم العثور على نتائج" : "No results found"}
            />
          </div>

          {municipality === "AAM" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground/80">{isAr ? "رقم الطريق" : "Road ID (AAM)"}</label>
              <Combobox
                options={roads.map((r) => ({ value: r, label: r }))}
                value={roadId}
                onValueChange={handleRoadChange}
                disabled={!community || loading.roads}
                placeholder={!community ? (isAr ? "اختر المجتمع أولاً" : "Pick community first") : loading.roads ? (isAr ? "جارٍ التحميل.." : "Loading...") : isAr ? "اختر رقم الطريق" : "Select road id"}
                searchPlaceholder={isAr ? "ابحث عن رقم الطريق..." : "Search road..."}
                emptyText={isAr ? "لم يتم العثور على نتائج" : "No results found"}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground/80">{isAr ? "رقم القطعة" : "Plot"}</label>
            <Combobox
              options={plotOptions.map((p) => ({ value: p.value, label: p.label }))}
              value={plot}
              onValueChange={handlePlotChange}
              disabled={!community}
              placeholder={!community
                ? (isAr ? "اختر المجتمع أولاً" : "Pick community first")
                : plotOptions.length === 0
                ? (isAr ? "لا توجد قطع متاحة" : "No plots available")
                : (isAr ? "اختر رقم القطعة" : "Select plot")}
              searchPlaceholder={isAr ? "ابحث عن رقم القطعة..." : "Search plot..."}
              emptyText={isAr ? "لم يتم العثور على نتائج" : "No results found"}
            />
            {community && plotOptions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "لا توجد قطع متاحة لهذه المنطقة" : "No plots found for the selected area"}
              </p>
            )}
          </div>
        </div>

        {/* MyLand iframe */}
        <div className="rounded-lg overflow-hidden border border-border shadow-sm bg-muted/30">
          <iframe
            ref={iframeRef}
            title="MyLand"
            src={isAr ? "https://myland.dmt.gov.ae/myland_lite/tamm/ar/index.html" : "https://myland.dmt.gov.ae/myland_lite/tamm/index.html"}
            className="w-full h-[480px] bg-background"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="min-w-[100px]">
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button 
            onClick={handleOk} 
            disabled={!canSubmit}
            className="min-w-[100px] bg-primary hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <span className="animate-pulse">{isAr ? "جارٍ الإرسال..." : "Submitting..."}</span>
              </>
            ) : (
              isAr ? "موافق" : "OK"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
