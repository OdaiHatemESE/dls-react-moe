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

type ChildListError = {
  error: string;
  needsSync?: boolean;
  emirateId?: string;
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

  // Extract error details including needsSync flag
  const errorDetails = React.useMemo(() => {
    if (error && typeof error === 'object') {
      // SWR jsonFetcher throws the parsed error object directly
      const errorObj = error as ChildListError;
      return {
        needsSync: errorObj.needsSync ?? false,
        emirateId: errorObj.emirateId,
      };
    }
    return { needsSync: false, emirateId: undefined };
  }, [error]);

  return { 
    children, 
    meta, 
    error, 
    isLoading,
    needsSync: errorDetails.needsSync,
    emirateId: errorDetails.emirateId
  } as const;
}
