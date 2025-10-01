"use client";

import { get } from "http";
import React from "react";
import useSWR from "swr";

export type StudentCard = {
  id: string;
  englishFirstName: string;
  englishSecondName: string;
  englishThirdName: string;
  englishFamilyName: string;

  arabicName: string;
  arabicSecondName: string;
  arabicThirdName: string;
  arabicFamilyName: string;
  nationalityEnglish: string;
  nationalityArabic: string;
  gender: string;
  birthDate: string;
};

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
   return {
    id: getProp<string>(p, "sourcedId") ?? "",
    englishFirstName: getProp<string>(p, "englishFirstName") ?? "",
    englishSecondName: getProp<string>(p, "englishSecondName") ?? "",
    englishThirdName: getProp<string>(p, "englishThirdName") ?? "",
    englishFamilyName: getProp<string>(p, "englishFamilyName") ?? "",

    arabicName: getProp<string>(p, "givenName") ?? "",
    arabicSecondName: getProp<string>(p, "middleName")?.split(" ")[0] || "",
    arabicThirdName: getProp<string>(p, "middleName")?.split(" ")[1] || "",
    arabicFamilyName: getProp<string>(p, "familyName") || "",

    nationalityEnglish: getProp<string>(p, "nationality") ?? "",
    nationalityArabic: getProp<string>(p, "nationalityArabic") ?? "",
    gender: getProp<string>(p, "gender") ?? "",
    birthDate: getProp<string>(p, "birthDate") ?? "",
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
