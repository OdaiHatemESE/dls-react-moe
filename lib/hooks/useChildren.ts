"use client";

import React from "react";
import useSWR from "swr";
import type { Person } from "@/types";

 
 

export function useChildren(eid?: string) {
  // If eid is provided, fetch for that eid, else fetch for current parent
  const key = eid
    ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}`
    : "/api/oneroster/basic-info-full";
  const { data, error, isLoading } = useSWR(key);
  const children: Person[] = React.useMemo(() => {
    const d = (data ?? {}) as { children?: Person[] };
    return Array.isArray(d.children) ? d.children : [];
  }, [data]);

  return { children, error, isLoading } as const;
}
