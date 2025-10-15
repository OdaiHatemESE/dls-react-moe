import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type ZoneRow = {
  Id: number;
  TitleAr: string;
  TitleEn: string;
  IsActive: boolean | number;
  RegionId: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const regionIdParam = searchParams.get("regionId");

    if (!regionIdParam) {
      return NextResponse.json({ error: "Missing regionId" }, { status: 400 });
    }
    const regionId = Number(regionIdParam);
    if (!Number.isFinite(regionId) || regionId <= 0) {
      return NextResponse.json({ error: "Invalid regionId" }, { status: 400 });
    }

    const rows = (await prisma.$queryRaw(
      Prisma.sql`SELECT Id, TitleAr, TitleEn, IsActive, RegionId
                 FROM Zones
                 WHERE (IsActive = 1 OR IsActive = CAST(1 AS bit)) AND RegionId = ${regionId}
                 ORDER BY TitleEn ASC`
    )) as ZoneRow[];

    // Normalize IsActive to boolean
    const zones = rows.map((z) => ({
      ...z,
      IsActive: Boolean(z.IsActive),
    }));

    return NextResponse.json({ data: zones, filter: { regionId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
