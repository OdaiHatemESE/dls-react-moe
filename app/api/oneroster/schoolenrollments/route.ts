import { NextResponse } from "next/server";
import { getSchoolEnrollmentsByStudent, getOrgBySourcedId } from "@/lib/roster-repo";
 

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

    // Try to fetch the org for the first enrollment's school as a convenience
    const schoolID = enrollments[0]?.school.sourcedId || null;
    const schoolInfo = schoolID ? await getOrgBySourcedId(schoolID) : [];
 

    return NextResponse.json({
      enrollments,
      count: enrollments.length,
      studentId,
      schoolYear: schoolYear || "all",
      schoolID,
      schoolInfo: Array.isArray(schoolInfo) && schoolInfo.length > 0 && "Org" in schoolInfo[0] ? schoolInfo[0].Org : null,
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