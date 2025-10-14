import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const emirateIdParam = searchParams.get("emirateId");

    let emirateId: number | null = null;
    if (emirateIdParam !== null) {
      const n = Number(emirateIdParam);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "Invalid emirateId" }, { status: 400 });
      }
      emirateId = n;
    }

    const base = Prisma.sql`SELECT Id, TitleAr, TitleEn, IsActive, EmirateId FROM Regions WHERE IsActive = 1`;
    const where = emirateId !== null ? Prisma.sql` AND EmirateId = ${emirateId}` : Prisma.empty;
    const order = Prisma.sql` ORDER BY TitleEn ASC`;

    const regions = (await prisma.$queryRaw(
      Prisma.sql`${base}${where}${order}`
    )) as Array<{ Id: number; TitleAr: string; TitleEn: string; IsActive: boolean; EmirateId: number }>;

    return NextResponse.json({ data: regions, filter: { emirateId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
