"use client";

import React from "react";
import useSWR from "swr";
import type { StudentCard } from "@/types";

function asRecord(x: unknown): Record<string, unknown> {
  return typeof x === "object" && x !== null
    ? (x as Record<string, unknown>)
    : {};
}
function getProp<T extends string | undefined = string | undefined>(
  obj: Record<string, unknown>,
  key: string
): T | undefined {
  return obj[key] as T | undefined;
}

const toStudentCard = (item: unknown): StudentCard | null => {
  const base = asRecord(item);
  //console.log('23:', base)
  const maybePersons = (base as { persons?: unknown }).persons;

  const p = asRecord(maybePersons ?? base);
  console.log("odai persons :", p);
  
  // Extract metadata for English fields
  const metadata = asRecord(getProp(p, "metadata"));
  console.log("odai metadata :", metadata);
  
   return {
    id: getProp<string>(p, "sourcedId") ?? "",
    englishFirstName: getProp<string>(metadata, "englishFirstName") ?? "",
    englishSecondName: getProp<string>(metadata, "englishSecondName") ?? "",
    englishThirdName: getProp<string>(metadata, "englishThirdName") ?? "",
    englishFamilyName: getProp<string>(metadata, "englishFamilyName") ?? "",

    arabicName: getProp<string>(p, "givenName") ?? "",
    arabicSecondName: getProp<string>(p, "middleName")?.split(" ")[0] || "",
    arabicThirdName: getProp<string>(p, "middleName")?.split(" ")[1] || "",
    arabicFamilyName: getProp<string>(p, "familyName") || "",

    nationalityEnglish: getProp<string>(metadata, "nationality") ?? getProp<string>(p, "nationality") ?? "",
    nationalityArabic: getProp<string>(p, "nationalityArabic") ?? "",
    gender: getProp<string>(metadata, "gender") ?? getProp<string>(p, "gender") ?? getProp<string>(p, "sex") ?? "",
    birthDate: getProp<string>(metadata, "birthDate") ?? getProp<string>(p, "birthDate") ?? getProp<string>(p, "dateOfBirth") ?? "",
  };

  
};

export function useChildren(eid?: string) {
  const key = eid
    ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}`
    : null;
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
