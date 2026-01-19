"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/app/i18n/I18nProvider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ApiResponse = {
  data?: any[];
  meta?: any;
  error?: string;
  status?: number;
  timestamp?: string;
};

type ApiCall = {
  url: string;
  method: string;
  status: "pending" | "success" | "error";
  response?: ApiResponse;
  duration?: number;
  error?: string;
};

export default function AddressDebugPage() {
  const { locale, t } = useI18n();
  const isAr = locale === "ar";

  // State for selections
  const [selectedStateId, setSelectedStateId] = React.useState<string>("");
  const [selectedCityId, setSelectedCityId] = React.useState<string>("");
  const [selectedRegionId, setSelectedRegionId] = React.useState<string>("");

  // State for API calls tracking
  const [apiCalls, setApiCalls] = React.useState<Record<string, ApiCall>>({});

  // State for data
  const [emirates, setEmirates] = React.useState<any[]>([]);
  const [regions, setRegions] = React.useState<any[]>([]);
  const [zones, setZones] = React.useState<any[]>([]);
  const [areas, setAreas] = React.useState<any[]>([]);

  // Fetch data function with tracking
  const fetchData = async (
    level: "emirate" | "region" | "zone" | "area",
    params?: Record<string, string>
  ) => {
    const sp = new URLSearchParams({ level, ...params });
    const url = `/api/db/auh-addresses?${sp.toString()}`;
    const callId = `${level}-${JSON.stringify(params || {})}`;

    // Mark as pending
    setApiCalls((prev) => ({
      ...prev,
      [callId]: {
        url,
        method: "GET",
        status: "pending",
      },
    }));

    const startTime = performance.now();

    try {
      const response = await fetch(url);
      const duration = performance.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Update API call status
      setApiCalls((prev) => ({
        ...prev,
        [callId]: {
          url,
          method: "GET",
          status: "success",
          response: {
            data: data.data,
            meta: data.meta,
            status: response.status,
            timestamp: new Date().toISOString(),
          },
          duration,
        },
      }));

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      setApiCalls((prev) => ({
        ...prev,
        [callId]: {
          url,
          method: "GET",
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          duration,
        },
      }));
      throw error;
    }
  };

  // Load emirates on mount
  React.useEffect(() => {
    fetchData("emirate")
      .then((data) => {
        setEmirates(data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load emirates:", err);
      });
  }, []);

  // Load regions when state selected
  React.useEffect(() => {
    if (!selectedStateId) {
      setRegions([]);
      return;
    }
    fetchData("region", { stateId: selectedStateId })
      .then((data) => {
        setRegions(data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load regions:", err);
        setRegions([]);
      });
  }, [selectedStateId]);

  // Load zones when city selected
  React.useEffect(() => {
    if (!selectedCityId) {
      setZones([]);
      return;
    }
    fetchData("zone", { cityId: selectedCityId })
      .then((data) => {
        setZones(data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load zones:", err);
        setZones([]);
      });
  }, [selectedCityId]);

  // Load areas when region selected
  React.useEffect(() => {
    if (!selectedRegionId) {
      setAreas([]);
      return;
    }
    fetchData("area", { regionId: selectedRegionId })
      .then((data) => {
        setAreas(data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load areas:", err);
        setAreas([]);
      });
  }, [selectedRegionId]);

  // Clear downstream selections
  const handleStateChange = (value: string) => {
    setSelectedStateId(value);
    setSelectedCityId("");
    setSelectedRegionId("");
    setRegions([]);
    setZones([]);
    setAreas([]);
  };

  const handleCityChange = (value: string) => {
    setSelectedCityId(value);
    setSelectedRegionId("");
    setZones([]);
    setAreas([]);
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegionId(value);
    setAreas([]);
  };

  const clearAll = () => {
    setSelectedStateId("");
    setSelectedCityId("");
    setSelectedRegionId("");
    setEmirates([]);
    setRegions([]);
    setZones([]);
    setAreas([]);
    setApiCalls({});
  };

  const getStatusColor = (status: ApiCall["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: ApiCall["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isAr ? "صفحة اختبار العناوين" : "Address Debug Page"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAr
              ? "اختبار API العناوين الموحد (AuhAddresses)"
              : "Test unified Address API (AuhAddresses)"}
          </p>
        </div>
        <Button onClick={clearAll} variant="outline" size="lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isAr ? "إعادة تعيين الكل" : "Clear All"}
        </Button>
      </div>

      {/* Address Hierarchy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isAr ? "التسلسل الهرمي للعنوان" : "Address Hierarchy"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Emirates (State) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  1
                </span>
                {isAr ? "الإمارة (State)" : "Emirate (State)"}
              </label>
              <Select value={selectedStateId} onValueChange={handleStateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isAr ? "اختر الإمارة" : "Select Emirate"} />
                </SelectTrigger>
                <SelectContent>
                  {emirates.map((emirate) => (
                    <SelectItem key={emirate.id} value={String(emirate.id)}>
                      {isAr ? emirate.titleAr : emirate.titleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {emirates.length} {isAr ? "إمارة متاحة" : "emirates available"}
              </div>
            </div>

            {/* Regions (City) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  2
                </span>
                {isAr ? "المنطقة (City)" : "Region (City)"}
              </label>
              <Select
                value={selectedCityId}
                onValueChange={handleCityChange}
                disabled={!selectedStateId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedStateId
                        ? isAr
                          ? "اختر الإمارة أولاً"
                          : "Select emirate first"
                        : isAr
                        ? "اختر المنطقة"
                        : "Select Region"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={String(region.id)}>
                      {isAr ? region.titleAr : region.titleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {regions.length} {isAr ? "منطقة متاحة" : "regions available"}
              </div>
            </div>

            {/* Zones (Region) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  3
                </span>
                {isAr ? "النطاق (Region)" : "Zone (Region)"}
              </label>
              <Select
                value={selectedRegionId}
                onValueChange={handleRegionChange}
                disabled={!selectedCityId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedCityId
                        ? isAr
                          ? "اختر المنطقة أولاً"
                          : "Select region first"
                        : isAr
                        ? "اختر النطاق"
                        : "Select Zone"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {isAr ? zone.titleAr : zone.titleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {zones.length} {isAr ? "نطاق متاح" : "zones available"}
              </div>
            </div>

            {/* Areas (Sector) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  4
                </span>
                {isAr ? "المنطقة (Sector)" : "Area (Sector)"}
              </label>
              <Select disabled={!selectedRegionId}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedRegionId
                        ? isAr
                          ? "اختر النطاق أولاً"
                          : "Select zone first"
                        : isAr
                        ? "اختر المنطقة"
                        : "Select Area"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={String(area.id)}>
                      {isAr ? area.titleAr : area.titleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {areas.length} {isAr ? "منطقة متاحة" : "areas available"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Calls Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isAr ? "سجل استدعاءات API" : "API Calls Log"}
            <Badge variant="outline">{Object.keys(apiCalls).length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.keys(apiCalls).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                {isAr ? "لا توجد استدعاءات API بعد" : "No API calls yet"}
              </div>
            ) : (
              Object.entries(apiCalls).map(([callId, call]) => (
                <div
                  key={callId}
                  className={cn(
                    "border rounded-lg p-4 space-y-3",
                    call.status === "success" && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
                    call.status === "error" && "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
                    call.status === "pending" && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
                  )}
                >
                  {/* Call Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", getStatusColor(call.status))}></span>
                        <span className="font-mono text-xs font-semibold">{call.method}</span>
                        {getStatusBadge(call.status)}
                        {call.duration && (
                          <Badge variant="outline" className="text-xs">
                            {call.duration.toFixed(0)}ms
                          </Badge>
                        )}
                      </div>
                      <code className="text-xs text-muted-foreground break-all">{call.url}</code>
                    </div>
                  </div>

                  {/* Response Data */}
                  {call.status === "success" && call.response && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">{isAr ? "الحالة:" : "Status:"}</span>{" "}
                          <Badge variant="outline">{call.response.status}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{isAr ? "العدد:" : "Count:"}</span>{" "}
                          <span className="font-semibold">{call.response.meta?.count ?? call.response.data?.length ?? 0}</span>
                        </div>
                        {call.response.meta?.level && (
                          <div>
                            <span className="text-muted-foreground">{isAr ? "المستوى:" : "Level:"}</span>{" "}
                            <Badge>{call.response.meta.level}</Badge>
                          </div>
                        )}
                      </div>

                      {/* Sample Data */}
                      {call.response.data && call.response.data.length > 0 && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                              {isAr ? "عرض البيانات النموذجية" : "View Sample Data"} ({call.response.data.length} {isAr ? "عنصر" : "items"})
                            </summary>
                            <div className="mt-2 p-3 bg-muted/50 rounded border overflow-auto max-h-60">
                              <pre className="text-xs">{JSON.stringify(call.response.data.slice(0, 3), null, 2)}</pre>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Details */}
                  {call.status === "error" && call.error && (
                    <div className="bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold text-red-900 dark:text-red-200 text-sm">
                            {isAr ? "خطأ في الاستدعاء" : "Call Error"}
                          </p>
                          <p className="text-red-700 dark:text-red-300 text-xs mt-1">{call.error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending State */}
                  {call.status === "pending" && (
                    <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isAr ? "جارٍ التحميل..." : "Loading..."}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {isAr ? "ملخص الاختيار الحالي" : "Current Selection Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selected Emirate */}
            {selectedStateId && (
              <div className="p-4 border rounded-lg bg-primary/5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {isAr ? "الإمارة المحددة" : "Selected Emirate"}
                </div>
                {emirates.find((e) => String(e.id) === selectedStateId) && (
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">
                      {isAr
                        ? emirates.find((e) => String(e.id) === selectedStateId)?.titleAr
                        : emirates.find((e) => String(e.id) === selectedStateId)?.titleEn}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>ID: {selectedStateId}</span>
                      {emirates.find((e) => String(e.id) === selectedStateId)?.manhalCode && (
                        <span>• Code: {emirates.find((e) => String(e.id) === selectedStateId)?.manhalCode}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Region */}
            {selectedCityId && (
              <div className="p-4 border rounded-lg bg-primary/5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {isAr ? "المنطقة المحددة" : "Selected Region"}
                </div>
                {regions.find((r) => String(r.id) === selectedCityId) && (
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">
                      {isAr
                        ? regions.find((r) => String(r.id) === selectedCityId)?.titleAr
                        : regions.find((r) => String(r.id) === selectedCityId)?.titleEn}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>ID: {selectedCityId}</span>
                      {regions.find((r) => String(r.id) === selectedCityId)?.manhalCode && (
                        <span>• Code: {regions.find((r) => String(r.id) === selectedCityId)?.manhalCode}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Zone */}
            {selectedRegionId && (
              <div className="p-4 border rounded-lg bg-primary/5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {isAr ? "النطاق المحدد" : "Selected Zone"}
                </div>
                {zones.find((z) => String(z.id) === selectedRegionId) && (
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">
                      {isAr
                        ? zones.find((z) => String(z.id) === selectedRegionId)?.titleAr
                        : zones.find((z) => String(z.id) === selectedRegionId)?.titleEn}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>ID: {selectedRegionId}</span>
                      {zones.find((z) => String(z.id) === selectedRegionId)?.manhalCode && (
                        <span>• Code: {zones.find((z) => String(z.id) === selectedRegionId)?.manhalCode}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Areas Count */}
            {selectedRegionId && areas.length > 0 && (
              <div className="p-4 border rounded-lg bg-primary/5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {isAr ? "المناطق المتاحة" : "Available Areas"}
                </div>
                <p className="font-semibold text-3xl">{areas.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? "منطقة في النطاق المحدد" : "areas in selected zone"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isAr ? "معلومات API" : "API Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">{isAr ? "نقطة النهاية" : "Endpoint"}</h4>
              <code className="bg-muted px-3 py-2 rounded block">
                GET /api/db/auh-addresses
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{isAr ? "المعاملات" : "Parameters"}</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">level</Badge>
                  <span className="text-muted-foreground">emirate | region | zone | area</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">stateId</Badge>
                  <span className="text-muted-foreground">{isAr ? "(للمنطقة)" : "(for region)"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">cityId</Badge>
                  <span className="text-muted-foreground">{isAr ? "(للنطاق)" : "(for zone)"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">regionId</Badge>
                  <span className="text-muted-foreground">{isAr ? "(للمنطقة)" : "(for area)"}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{isAr ? "التسلسل الهرمي" : "Hierarchy"}</h4>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <Badge className="bg-blue-500">State (Emirate)</Badge>
                <span>→</span>
                <Badge className="bg-green-500">City (Region)</Badge>
                <span>→</span>
                <Badge className="bg-yellow-500">Region (Zone)</Badge>
                <span>→</span>
                <Badge className="bg-purple-500">Sector (Area)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
