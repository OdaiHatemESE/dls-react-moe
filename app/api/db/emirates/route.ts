import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client-student-registration";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const emirates = (await prisma.$queryRaw(
      Prisma.sql`SELECT Id, TitleAr, TitleEn, IsActive, ManhalCode FROM Emirates WHERE IsActive = 1 ORDER BY TitleEn ASC`
    )) as Array<{ Id: number; TitleAr: string; TitleEn: string; IsActive: boolean; ManhalCode: string | null }>;
    return NextResponse.json({ data: emirates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
