"use client";

import React from "react";
import useSWR from "swr";
import type { StudentProfileV1 } from "@/app/types/studentprofile";

export function useChildren(eid?: string) {
  // If eid is provided, fetch for that eid, else return null (no session-based fallback)
  const key = eid ? `/api/PP/ChildList/${encodeURIComponent(eid)}` : null;
  
  const { data, error, isLoading } = useSWR<StudentProfileV1[]>(key);
  
  const children: StudentProfileV1[] = React.useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  return { children, error, isLoading } as const;
}
