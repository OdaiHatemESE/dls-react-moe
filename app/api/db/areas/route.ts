import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client-student-registration";

export const dynamic = "force-dynamic";

type AreaRow = {
  Id: number;
  TitleAr: string;
  TitleEn: string;
  IsActive: boolean;
  ZoneId: number;
  ManhalCode: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneIdParam = searchParams.get("zoneId");
    const isAbuDhabiParam = searchParams.get("isAbuDhabi");
    const gradeCode = searchParams.get("gradeCode") || undefined;
    const genderCode = searchParams.get("genderCode") || undefined;

    // validate zoneId
    if (!zoneIdParam) {
      return NextResponse.json({ error: "Missing zoneId" }, { status: 400 });
    }
    const zoneId = Number(zoneIdParam);
    if (!Number.isFinite(zoneId) || zoneId <= 0) {
      return NextResponse.json({ error: "Invalid zoneId" }, { status: 400 });
    }

    // parse boolean (defaults to false)
    const isAbuDhabi = ["1", "true", "yes"].includes((isAbuDhabiParam || "").toLowerCase());

    let rows: AreaRow[] = [];

    if (isAbuDhabi) {
      // direct filter on ZoneId
      rows = (await prisma.$queryRaw(
        Prisma.sql`SELECT Id, TitleAr, TitleEn, IsActive, ZoneId, ManhalCode
                   FROM Areas
                   WHERE IsActive = 1 AND ZoneId = ${zoneId}
                   ORDER BY TitleAr ASC`
      )) as AreaRow[];
    } else {
      // match EF: Areas where Area.IsActive and Area.Zone.Region.Emirate.Id == zoneId
      // Joins: Areas -> Zones (on Areas.ZoneId = Zones.Id), Zones -> Regions (Regions.Id = Zones.RegionId), Regions -> Emirates (Emirates.Id = Regions.EmirateId)
      rows = (await prisma.$queryRaw(
        Prisma.sql`SELECT A.Id, A.TitleAr, A.TitleEn, A.IsActive, A.ZoneId, A.ManhalCode
                   FROM Areas A
                   INNER JOIN Zones Z ON Z.Id = A.ZoneId
                   INNER JOIN Regions R ON R.Id = Z.RegionId
                   INNER JOIN Emirates E ON E.Id = R.EmirateId
                   WHERE A.IsActive = 1 AND E.Id = ${zoneId}
                   ORDER BY A.TitleAr ASC`
      )) as AreaRow[];
    }
  
    return NextResponse.json({
      data: rows,
      meta: {
        zoneId,
        isAbuDhabi,
        // passthrough of optional params for future use
        gradeCode: gradeCode ?? null,
        genderCode: genderCode ?? null,
        count: rows.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
