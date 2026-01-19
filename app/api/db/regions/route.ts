import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client-student-registration";


export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const emirateIdParam = searchParams.get("emirateId");
    const showAll = searchParams.get("showAll") === "true"; // Debug parameter

    let emirateId: number | null = null;
    if (emirateIdParam !== null) {
      const n = Number(emirateIdParam);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "Invalid emirateId" }, { status: 400 });
      }
      emirateId = n;
    }

    // Filter for active regions (IsActive = 1 or TRUE)
    const base = Prisma.sql`SELECT Id, TitleAr, TitleEn, IsActive, EmirateId, ManhalCode FROM Regions WHERE IsActive = CAST(1 AS bit)`;
    const where = emirateId !== null ? Prisma.sql` AND EmirateId = ${emirateId}` : Prisma.empty;
    const order = Prisma.sql` ORDER BY TitleEn ASC`;

    const regions = (await prisma.$queryRaw(
      Prisma.sql`${base}${where}${order}`
    )) as Array<{ Id: number; TitleAr: string; TitleEn: string; IsActive: boolean | number; EmirateId: number; ManhalCode: string | null }>;

    return NextResponse.json({ data: regions, filter: { emirateId, showAll } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
