"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Clock, Wifi, WifiOff, Download } from "lucide-react";
import { mutate } from "swr";
import { buildNoCacheUrl } from "@/lib/refresh";
import { timeAgo } from "@/lib/time";

export type CacheMeta = { source?: "cache" | "upstream"; lastUpdated?: string | null };

type Props<T> = {
  swrKey: string | null;
  meta?: { cache?: CacheMeta };
  labels?: {
    lastUpdated?: string;
    confirm?: string;
    refresh?: string;
    refreshing?: string;
    unknown?: string;
    refreshSuccess?: string;
    refreshError?: string;
  };
  // Optional: transform fetched JSON before mutate
  onAfterFetch?: (json: T) => T;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "compact" | "minimal";
};

export function RefreshBar<T = any>({ 
  swrKey, 
  meta, 
  labels, 
  onAfterFetch, 
  className, 
  showIcon = true,
  variant = "default"
}: Props<T>) {
  const [isRefreshing, setRefreshing] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null);
  const [refreshStatus, setRefreshStatus] = React.useState<"idle" | "success" | "error">("idle");
  
  const t = {
    lastUpdated: labels?.lastUpdated ?? "Last updated",
    confirm: labels?.confirm ?? "Refresh data now?",
    refresh: labels?.refresh ?? "Refresh",
    refreshing: labels?.refreshing ?? "Updating...",
    unknown: labels?.unknown ?? "Unknown",
    refreshSuccess: labels?.refreshSuccess ?? "Data updated successfully",
    refreshError: labels?.refreshError ?? "Failed to update data",
  };

  const lastUpdated = meta?.cache?.lastUpdated ?? null;
  const fromCache = !meta?.cache || meta?.cache?.source === "cache";

  // Auto-clear status after 3 seconds
  React.useEffect(() => {
    if (refreshStatus !== "idle") {
      const timer = setTimeout(() => setRefreshStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [refreshStatus]);

  const doRefresh = async () => {
    if (!swrKey) return;
    
    // Simple confirmation without mentioning outdated data
    if (!window.confirm(t.confirm)) return;
    
    try {
      setRefreshing(true);
      setRefreshStatus("idle");
      const url = buildNoCacheUrl(swrKey);
      const res = await fetch(url, { cache: "no-store" });
      
      if (!res.ok) {
        throw new Error(`Network error: ${res.status} ${res.statusText}`);
      }
      
      const json = (await res.json()) as T;
      mutate(swrKey, onAfterFetch ? onAfterFetch(json) : json, false);
      setLastRefresh(new Date());
      setRefreshStatus("success");
    } catch (error) {
      console.error("Refresh failed:", error);
      setRefreshStatus("error");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    if (isRefreshing) return (
      <div className="relative">
        <RefreshCcw className="animate-spin text-blue-500" size={18} />
        <div className="absolute inset-0 animate-pulse bg-blue-500/20 rounded-full"></div>
      </div>
    );
    if (refreshStatus === "success") return (
      <div className="relative">
        <Wifi className="text-emerald-500 drop-shadow-sm" size={18} />
        <div className="absolute -inset-1 bg-emerald-500/10 rounded-full animate-ping"></div>
      </div>
    );
    if (refreshStatus === "error") return (
      <div className="relative">
        <WifiOff className="text-red-500 drop-shadow-sm" size={18} />
        <div className="absolute -inset-1 bg-red-500/10 rounded-full animate-pulse"></div>
      </div>
    );
    return (
      <div className="p-1 bg-muted/50 rounded-full">
        <Wifi className="text-emerald-500 drop-shadow-sm" size={25} />
      </div>
    );
  };

  const getStatusMessage = () => {
    if (refreshStatus === "success") return t.refreshSuccess;
    if (refreshStatus === "error") return t.refreshError;
    return null;
  };

  // Enhanced variant-based styling
  const getContainerClasses = () => {
    const base = "flex items-center gap-3 rounded-lg border transition-all duration-300";
    const variants = {
      default: "justify-between px-4 py-2 bg-primary/5 hover:bg-primary/8 hover:scale-[1.01] border-primary/20",
      compact: "justify-between px-3 py-2 bg-primary/5 hover:bg-primary/8 border-primary/15",
      minimal: "justify-end p-2 bg-transparent border-transparent hover:bg-primary/5"
    };
    return `${base} ${variants[variant]} ${className ?? ""}`;
  };

  const statusMessage = getStatusMessage();
  const displayTime = lastRefresh?.toISOString() || lastUpdated;
  
  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return { date: t.unknown, time: '' };
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
      
      let dateStr: string;
      if (isToday) {
        dateStr = 'Today';
      } else if (isYesterday) {
        dateStr = 'Yesterday';
      } else {
        dateStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
      
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      return { date: dateStr, time: timeStr };
    } catch {
      return { date: t.unknown, time: '' };
    }
  };
  
  const { date: lastUpdateDate, time: lastUpdateTime } = formatDateTime(displayTime);

  if (variant === "minimal") {
    return (
      <div className={getContainerClasses()}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={doRefresh} 
          disabled={isRefreshing}
          className="gap-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg px-4 py-2"
        >
          {showIcon && getStatusIcon()}
          <span className="font-medium">{isRefreshing ? t.refreshing : t.refresh}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={getContainerClasses()}>
      <div className="flex items-center gap-3">
        {showIcon && (
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 rounded-full">
            <Download className="text-muted-foreground" size={12} />
            <span className="text-muted-foreground font-medium text-xs">{t.lastUpdated}</span>
          </div>
          <div className="px-2 py-1 bg-primary/10 rounded-full">
            <span className="font-semibold text-primary text-xs">
              {lastUpdateDate}
            </span>
          </div>
          {lastUpdateTime && (
            <div className="px-2 py-1 bg-secondary/20 rounded-full">
              <span className="font-medium text-secondary-foreground text-xs flex items-center gap-1">
                <Clock size={10} />
                {lastUpdateTime}
              </span>
            </div>
          )}
        </div>
        {statusMessage && (
          <div className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 ${
            refreshStatus === "success" 
              ? "text-emerald-700 bg-emerald-100 border border-emerald-200" : 
            refreshStatus === "error" 
              ? "text-red-700 bg-red-100 border border-red-200" : 
              "text-muted-foreground bg-muted/50"
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
      
      <Button 
        variant="default"
        size="sm"
        onClick={doRefresh} 
        disabled={isRefreshing}
        className={`gap-2 min-w-fit transition-all duration-300 bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-md px-4 py-2 font-medium ${
          isRefreshing ? "cursor-wait animate-pulse opacity-80" : "hover:scale-105"
        }`}
      >
        <div className="relative">
          <RefreshCcw className={`${isRefreshing ? "animate-spin text-white" : "text-white"} transition-all duration-300`} size={16} />
          {isRefreshing && (
            <div className="absolute inset-0 animate-pulse bg-blue-500/20 rounded-full"></div>
          )}
        </div>
        <span className="font-medium text-white text-sm">
          {isRefreshing ? t.refreshing : t.refresh}
        </span>
      </Button>
    </div>
  );
}

export default RefreshBar;
