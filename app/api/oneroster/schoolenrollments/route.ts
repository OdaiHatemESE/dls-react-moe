import { NextResponse } from "next/server";
import { getSchoolEnrollmentsByStudent, getOrgBySourcedId, getStreamGradeById } from "@/lib/roster-repo";
// Caching helpers
import { cacheGetJSON, cacheSetJSON, makeKey } from "@/lib/cache";
// Ensure route is dynamic (no ISR)
export const dynamic = "force-dynamic";

// TTLs for cached entities
const TTL = {
  ENROLLMENTS: 60 * 60, // 1 hour
  ORG: 60 * 60,         // 1 hour
  STREAMGRADE: 60 * 60, // 1 hour
} as const;
 

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const schoolYear = searchParams.get("schoolYear");
  const noCache = ["1", "true", "yes"].includes((searchParams.get("nocache") || "").toLowerCase());

  if (!studentId) {
    return NextResponse.json(
      { error: "Missing required parameter: studentId" }, 
      { status: 400 }
    );
  }

  try {
    // Cache enrollments by student and schoolYear (or "all")
    const enrollmentsKey = makeKey(["or", "enrollments", "student", studentId, schoolYear || "all"]);

    type Wrapped<T> = { data: T; fetchedAt: string };

    let enrollments: Array<any> = [];
    let fetchedAt: string | null = null;
    let source: "cache" | "upstream" = "cache";

    if (!noCache) {
      const cachedAny = await cacheGetJSON<unknown>(enrollmentsKey);
      if (cachedAny) {
        if (Array.isArray(cachedAny)) {
          // Backwards-compat with older cache shape
          enrollments = cachedAny as Array<any>;
          fetchedAt = null;
          source = "cache";
        } else if (
          typeof cachedAny === "object" && cachedAny !== null &&
          Array.isArray((cachedAny as Wrapped<Array<any>>).data)
        ) {
          const wrapped = cachedAny as Wrapped<Array<any>>;
          enrollments = wrapped.data;
          fetchedAt = wrapped.fetchedAt ?? null;
          source = "cache";
        }
      }
    }

    if (!enrollments.length) {
      // Fetch fresh from upstream and update cache with wrapped payload
      const fresh = await getSchoolEnrollmentsByStudent(studentId, schoolYear || undefined);
      enrollments = fresh;
      fetchedAt = new Date().toISOString();
      source = "upstream";
      await cacheSetJSON<Wrapped<Array<any>>>(enrollmentsKey, { data: fresh, fetchedAt }, { ttlSeconds: TTL.ENROLLMENTS });
    }

    console.debug(`Returning ${enrollments.length} enrollments for student ${studentId}`);

    // Collect unique school IDs from enrollments
    const schoolIDs = Array.from(
      new Set(
        enrollments
          .map((e) => e?.school?.sourcedId)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    // Fetch org info for all schools with caching (backwards-compat keeps first result fields)
    let schoolInfos: Array<unknown> = [];
    if (schoolIDs.length > 1) {
      const results = await Promise.all(
        schoolIDs.map(async (id) => {
          const key = makeKey(["or", "org", "sourcedId", id]);
          if (!noCache) {
            const cached = await cacheGetJSON<unknown>(key);
            if (cached) return cached;
          }
          const org = await getOrgBySourcedId(id);
          if (org) await cacheSetJSON(key, org, { ttlSeconds: TTL.ORG });
          return org ?? null;
        })
      );
      schoolInfos = results.filter((o): o is NonNullable<typeof o> => Boolean(o));
    } else if (schoolIDs.length === 1) {
      const id = schoolIDs[0]!;
      const key = makeKey(["or", "org", "sourcedId", id]);
      let single: unknown = null;
      if (!noCache) {
        single = await cacheGetJSON<unknown>(key);
      }
      if (!single) {
        single = await getOrgBySourcedId(id);
        if (single) await cacheSetJSON(key, single, { ttlSeconds: TTL.ORG });
      }
      schoolInfos = single ? [single] : [];
    }

    const schoolID = schoolIDs[0] ?? null;
    const schoolInfo = schoolInfos[0] ?? null;
    // Cache stream grade lookups per sourcedId
    const StreamGrades = await Promise.all(
      enrollments.map(async (e: any) => {
        const sgId: string | undefined = e?.streamGrade?.sourcedId;
        if (!sgId) return null;
        const key = makeKey(["or", "streamgrade", sgId]);
        if (!noCache) {
          const cached = await cacheGetJSON<unknown>(key);
          if (cached) return cached;
        }
        try {
          const sg = await getStreamGradeById(sgId);
          if (sg) await cacheSetJSON(key, sg, { ttlSeconds: TTL.STREAMGRADE });
          return sg ?? null;
        } catch {
          return null;
        }
      })
    );

  
    return NextResponse.json({
      enrollments,
      count: enrollments.length,
      studentId,
      schoolYear: schoolYear || "all",
      // Backwards-compatible fields
      schoolID,
      schoolInfo,
      // New fields with all schools' info
      schoolIDs,
      schoolInfos,
      StreamGrades,
      meta: {
        cache: {
          source,
          lastUpdated: fetchedAt,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching school enrollments:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}