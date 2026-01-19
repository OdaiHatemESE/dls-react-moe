import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client-student-registration";


export const dynamic = "force-dynamic";

type ZoneRow = {
  Id: number;
  TitleAr: string;
  TitleEn: string;
  IsActive: boolean | number;
  RegionId: number;
  ManhalCode: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const regionIdParam = searchParams.get("regionId");
    const showAll = searchParams.get("showAll") === "true"; // Debug parameter

    if (!regionIdParam && !showAll) {
      return NextResponse.json({ error: "Missing regionId" }, { status: 400 });
    }
    
    let regionId: number | null = null;
    if (regionIdParam) {
      const n = Number(regionIdParam);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "Invalid regionId" }, { status: 400 });
      }
      regionId = n;
    }

    // Filter for active zones (IsActive = 1 or TRUE)
    const base = Prisma.sql`SELECT Id, TitleAr, TitleEn, IsActive, RegionId, ManhalCode FROM Zones WHERE IsActive = CAST(1 AS bit)`;
    const where = regionId !== null ? Prisma.sql` AND RegionId = ${regionId}` : Prisma.empty;
    const order = Prisma.sql` ORDER BY TitleEn ASC`;

    const rows = (await prisma.$queryRaw(
      Prisma.sql`${base}${where}${order}`
    )) as ZoneRow[];

    return NextResponse.json({ data: rows, filter: { regionId, showAll, count: rows.length } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
