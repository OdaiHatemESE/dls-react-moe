"use client";

import React from "react";
import useSWR from "swr";

export type StudentCard = {
  id: string;
  name: string;
  grade?: string;
  classroom?: string;
  teacher?: string;
  avatar?: string;
  attendanceRate?: number;
  latestGrade?: string;
  nextEvent?: string;
};

function asRecord(x: unknown): Record<string, unknown> {
  return typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {};
}
function getProp<T extends string | undefined = string | undefined>(obj: Record<string, unknown>, key: string): T | undefined {
  return obj[key] as T | undefined;
}

const toStudentCard = (item: unknown): StudentCard | null => {
  const base = asRecord(item);
  const maybePersons = (base as { persons?: unknown }).persons;
  const p = asRecord(maybePersons ?? base);
  const sourcedId =
    getProp<string>(p, "sourcedId") ||
    getProp<string>(p, "identifier") ||
    getProp<string>(p, "id");
  if (!sourcedId) return null;

  const given =
    getProp<string>(p, "givenName") ||
    getProp<string>(p, "englishFirstName") ||
    getProp<string>(p, "firstName") ||
    "";
  const family =
    getProp<string>(p, "familyName") ||
    getProp<string>(p, "englishFamilyName") ||
    getProp<string>(p, "lastName") ||
    "";
  const name = `${given} ${family}`.trim() || getProp<string>(p, "name") || getProp<string>(p, "displayName") || sourcedId;
  const grade = getProp<string>(p, "grades") || getProp<string>(p, "grade");

  return {
    id: String(sourcedId),
    name,
    grade: typeof grade === "string" ? grade : undefined,
    classroom: getProp<string>(p, "classroom") || getProp<string>(p, "class") || getProp<string>(p, "section") || undefined,
    teacher: getProp<string>(p, "teacher") || getProp<string>(p, "homeroomTeacher") || undefined,
    avatar: getProp<string>(p, "photoUrl") || getProp<string>(p, "avatarUrl") || undefined,
    attendanceRate: undefined,
    latestGrade: undefined,
    nextEvent: undefined,
  };
};

export function useChildren(eid?: string) {
  const key = eid ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}` : null;
  const { data, error, isLoading } = useSWR(key);
  const children: StudentCard[] = React.useMemo(() => {
    const d = (data ?? {}) as { children?: unknown[] };
    const rawChildren: unknown[] = Array.isArray(d.children) ? d.children : [];
    return rawChildren
      .map((c) => toStudentCard(c))
      .filter((x): x is StudentCard => !!x);
  }, [data]);

  return { children, error, isLoading } as const;
}
