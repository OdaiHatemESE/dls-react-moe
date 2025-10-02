import { NextResponse } from "next/server";
import { getSchoolEnrollmentsByStudent } from "@/lib/roster-repo";

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
    
    return NextResponse.json({
      enrollments,
      count: enrollments.length,
      studentId,
      schoolYear: schoolYear || "all"
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