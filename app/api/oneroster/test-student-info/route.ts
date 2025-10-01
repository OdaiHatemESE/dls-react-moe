import { NextResponse } from "next/server";
import { getStudentsBasic } from "@/lib/roster-repo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids"); // comma-separated
  if (!idsParam) return NextResponse.json({ error: "Missing ?ids=ID1,ID2" }, { status: 400 });

  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const students = await getStudentsBasic(ids);
    return NextResponse.json({ students });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
