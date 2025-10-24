"use client";

import React from "react";
import useSWR from "swr";
import type { StudentProfileV1 } from "@/app/types/studentprofile";

type ChildListResponse = {
  students: StudentProfileV1[];
  meta?: {
    cache?: {
      source?: 'cache' | 'upstream';
      lastUpdated?: string | null;
    };
  };
};

export function useChildren(eid?: string) {
  // If eid is provided, fetch for that eid, else return null (no session-based fallback)
  const key = eid ? `/api/PP/ChildList/${encodeURIComponent(eid)}` : null;
  
  const { data, error, isLoading } = useSWR<ChildListResponse | StudentProfileV1[]>(key);
  
  const children: StudentProfileV1[] = React.useMemo(() => {
    // Handle new response format with students and meta
    if (data && typeof data === 'object' && 'students' in data) {
      return Array.isArray(data.students) ? data.students : [];
    }
    // Backwards compatibility with old format (direct array)
    return Array.isArray(data) ? data : [];
  }, [data]);
  
  const meta = React.useMemo(() => {
    if (data && typeof data === 'object' && 'meta' in data) {
      return data.meta;
    }
    return undefined;
  }, [data]);

  return { children, meta, error, isLoading } as const;
}
