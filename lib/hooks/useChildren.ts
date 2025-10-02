"use client";

import React from "react";
import useSWR from "swr";
import type { Person } from "@/types";

 
// ...existing code...

// No longer needed: toStudentCard

export function useChildren(eid?: string) {
  const key = eid
    ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}`
    : null;
  const { data, error, isLoading } = useSWR(key);
  const children: Person[] = React.useMemo(() => {
    const d = (data ?? {}) as { children?: Person[] };
    return Array.isArray(d.children) ? d.children : [];
  }, [data]);

  return { children, error, isLoading } as const;
}
