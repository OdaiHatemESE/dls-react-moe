// app/api/oneroster/test-person/route.ts
import { NextResponse } from "next/server";
import { getPersonByEid } from "@/lib/roster-repo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eid = searchParams.get("eid");

  if (!eid) {
    return NextResponse.json({ error: "Missing ?eid" }, { status: 400 });
  }

  try {
    const person = await getPersonByEid(eid);
    if (!person) {
      return NextResponse.json({ error: `No person found for EID ${eid}` }, { status: 404 });
    }
    return NextResponse.json(person);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
