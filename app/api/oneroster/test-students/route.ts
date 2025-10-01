import { NextResponse } from "next/server";
import { getStudentIdsForPerson } from "@/lib/roster-repo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get("personId");
  if (!personId) return NextResponse.json({ error: "Missing ?personId" }, { status: 400 });

  try {
    const ids = await getStudentIdsForPerson(personId);
    return NextResponse.json({ studentIds: ids });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
