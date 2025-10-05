"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { Warning } from "@phosphor-icons/react";
import { mutate } from "swr";
import { buildNoCacheUrl } from "@/lib/refresh";
import { timeAgo } from "@/lib/time";

export type CacheMeta = { source?: "cache" | "upstream"; lastUpdated?: string | null };

type Props<T> = {
  swrKey: string | null;
  meta?: { cache?: CacheMeta };
  labels?: {
    lastUpdated?: string;
    outdatedMsg?: string;
    confirm?: string;
    refresh?: string;
    refreshing?: string;
    unknown?: string;
  };
  // Optional: transform fetched JSON before mutate
  onAfterFetch?: (json: T) => T;
  className?: string;
};

export function RefreshBar<T = any>({ swrKey, meta, labels, onAfterFetch, className }: Props<T>) {
  const [isRefreshing, setRefreshing] = React.useState(false);
  const t = {
    lastUpdated: labels?.lastUpdated ?? "Last updated:",
    outdatedMsg: labels?.outdatedMsg ?? "Your data might be outdated. Click refresh to update.",
    confirm: labels?.confirm ?? "Fetch fresh data?",
    refresh: labels?.refresh ?? "Refresh",
    refreshing: labels?.refreshing ?? "Refreshing…",
    unknown: labels?.unknown ?? "unknown",
  };

  const lastUpdated = meta?.cache?.lastUpdated ?? null;
  const fromCache = !meta?.cache || meta?.cache?.source === "cache";

  const doRefresh = async () => {
    if (!swrKey) return;
    if (!window.confirm(t.confirm)) return;
    try {
      setRefreshing(true);
      const url = buildNoCacheUrl(swrKey);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
      const json = (await res.json()) as T;
      mutate(swrKey, onAfterFetch ? onAfterFetch(json) : json, false);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch fresh data.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={"flex items-center justify-between gap-3 rounded-md border p-3 bg-card " + (className ?? "") }>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t.lastUpdated}</span>
        <span className="font-medium">{timeAgo(lastUpdated)}</span>
        {fromCache && (
          <span className="flex items-center gap-1 text-amber-600">
            <Warning size={16} />
            <span>{t.outdatedMsg}</span>
          </span>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={doRefresh} disabled={isRefreshing}>
        <RefreshCcw className={isRefreshing ? "animate-spin" : ""} size={16} />
        <span className="ml-2">{isRefreshing ? t.refreshing : t.refresh}</span>
      </Button>
    </div>
  );
}

export default RefreshBar;
