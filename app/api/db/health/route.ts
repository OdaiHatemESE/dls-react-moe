import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<Array<{ value: number }>>`SELECT 1 as value`;
    const ok = Array.isArray(rows) && rows[0]?.value === 1;
    return NextResponse.json({ ok, message: ok ? "DB OK" : "DB check returned unexpected result" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
