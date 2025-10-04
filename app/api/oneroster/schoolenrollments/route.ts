import { NextResponse } from "next/server";
import { getSchoolEnrollmentsByStudent, getOrgBySourcedId, getStreamGradeById } from "@/lib/roster-repo";
 

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const schoolYear = searchParams.get("schoolYear");

  if (!studentId) {
    return NextResponse.json(
      { error: "Missing required parameter: studentId" }, 
      { status: 400 }
    );
  }

  try {
    const enrollments = await getSchoolEnrollmentsByStudent(studentId, schoolYear || undefined);
    console.debug(`Returning ${enrollments.length} enrollments for student ${studentId}`);

    // Collect unique school IDs from enrollments
    const schoolIDs = Array.from(
      new Set(
        enrollments
          .map((e) => e?.school?.sourcedId)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    // Fetch org info for all schools if multiple, otherwise just the first (for backwards-compat)
    let schoolInfos: Array<unknown> = [];
    if (schoolIDs.length > 1) {
      const results = await Promise.all(schoolIDs.map((id) => getOrgBySourcedId(id)));
      schoolInfos = results.filter((o): o is NonNullable<typeof o> => Boolean(o));
    } else if (schoolIDs.length === 1) {
      const single = await getOrgBySourcedId(schoolIDs[0]!);
      schoolInfos = single ? [single] : [];
    }

    const schoolID = schoolIDs[0] ?? null;
    const schoolInfo = schoolInfos[0] ?? null;
    const StreamGrades = await Promise.all(enrollments.map(e => e.streamGrade ? getStreamGradeById(e.streamGrade.sourcedId) : null));

  
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
  StreamGrades
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