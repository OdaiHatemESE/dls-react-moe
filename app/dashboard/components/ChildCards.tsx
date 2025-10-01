"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AttendanceIcon,
  GradesIcon,
  CalendarIcon,
  ChevronRightIcon,
} from "@/app/components/icons";
import { useI18n } from "@/app/i18n/I18nProvider";
import clsx from "clsx";
import { useSession } from "next-auth/react";

type StudentCard = {
  id: string;
  name: string;
  grade?: string;
  classroom?: string;
  teacher?: string;
  avatar?: string;
  attendanceRate?: number; // optional; show placeholder when absent
  latestGrade?: string;
  nextEvent?: string;
};

export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();
  const [children, setChildren] = React.useState<StudentCard[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  // Safe getters
  const asRecord = (x: unknown): Record<string, unknown> =>
    typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {};
  const getProp = <T extends string | undefined = string | undefined>(
    obj: Record<string, unknown>,
    key: string
  ): T | undefined => obj[key] as T | undefined;

  // Normalize vendor child object into StudentCard
  const toStudentCard = React.useCallback(
    (item: unknown): StudentCard | null => {
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
      const name =
        `${given} ${family}`.trim() ||
        getProp<string>(p, "name") ||
        getProp<string>(p, "displayName") ||
        sourcedId;
      const grade = getProp<string>(p, "grades") || getProp<string>(p, "grade");

      return {
        id: String(sourcedId),
        name,
        grade: typeof grade === "string" ? grade : undefined,
        classroom:
          getProp<string>(p, "classroom") ||
          getProp<string>(p, "class") ||
          getProp<string>(p, "section") ||
          undefined,
        teacher:
          getProp<string>(p, "teacher") ||
          getProp<string>(p, "homeroomTeacher") ||
          undefined,
        avatar:
          getProp<string>(p, "photoUrl") ||
          getProp<string>(p, "avatarUrl") ||
          undefined,
        // The remaining fields aren't available from OneRoster by default; placeholders
        attendanceRate: undefined,
        latestGrade: undefined,
        nextEvent: undefined,
      };
    },
    []
  );

  React.useEffect(() => {
    // Wait until session is loaded
    if (status !== "authenticated") return;
    const eidOpt = session?.user?.emiratesId || "784198791735438";
    console.log(session);
    if (!eidOpt) return;
    const eid: string = eidOpt;

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // NOTE: Endpoint requested by user; ensure CORS is allowed when running in browser
        const url = `/api/oneroster/basic-info-full?eid=${encodeURIComponent(
          eid
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
          );
        }
        const data: unknown = await res.json();
        const d = data as { children?: unknown[] };
        const rawChildren: unknown[] = Array.isArray(d.children)
          ? d.children
          : [];
        const mapped: StudentCard[] = rawChildren
          .map((c) => toStudentCard(c))
          .filter((x): x is StudentCard => !!x);
        if (!cancelled) setChildren(mapped);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to load children";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session, session?.user?.emiratesId, status, toStudentCard]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {loading && (
        <div className="col-span-full text-center text-sm text-gray-500">
          {"Loading..."}
        </div>
      )}
      {error && (
        <div
          className="col-span-full text-center text-sm text-red-600"
          role="alert"
        >
          {error}
        </div>
      )}
      {(children ?? []).map((child) => (
        <Card
          key={child.id}
          className="group relative hover:shadow-lg transition-all border border-transparent hover:border-blue-100"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                  {child.avatar ? (
                    <AvatarImage src={child.avatar} alt={child.name} />
                  ) : (
                    <AvatarImage src="" alt={child.name} />
                  )}
                  <AvatarFallback>
                    {child.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="text-lg leading-tight truncate">
                    {child.name}
                  </CardTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {child.grade && (
                      <Badge variant="secondary" className="px-2 py-0.5">
                        {child.grade}
                      </Badge>
                    )}
                    {child.classroom && (
                      <span className="text-gray-500">• {child.classroom}</span>
                    )}
                    {child.teacher && (
                      <span className="text-gray-500">• {child.teacher}</span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/child/${child.id}`}
                className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
                aria-label={`View details for ${child.name}`}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-2">
                  <AttendanceIcon className="w-5 h-5 text-green-600" />
                </div>
                {typeof child.attendanceRate === "number" ? (
                  <>
                    <p className="text-2xl font-semibold text-gray-900">
                      {child.attendanceRate}%
                    </p>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          child.attendanceRate >= 90
                            ? "bg-green-500"
                            : child.attendanceRate >= 75
                            ? "bg-amber-500"
                            : "bg-red-500"
                        } rounded-full`}
                        style={{ width: `${child.attendanceRate}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-medium text-gray-500">—</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {t.dashboard.attendance}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <GradesIcon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {child.latestGrade ?? "—"}
                </p>
                <p className="text-xs text-gray-600">
                  {t.dashboard.latestGrade}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div
                  className={clsx(
                    "flex items-center justify-center gap-2",
                    locale === "ar" && "flex-row-reverse"
                  )}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-purple-500"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-gray-900 leading-tight truncate max-w-[12rem]">
                    {child.nextEvent ?? "—"}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {t.dashboard.nextEvent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {/* If no children fetched and not loading/error, optionally show nothing or a helpful hint */}
      {!loading && !error && (!children || children.length === 0) && (
        <div className="col-span-full text-center text-sm text-gray-500">
          {"No linked students found for your account."}
        </div>
      )}
    </div>
  );
}
