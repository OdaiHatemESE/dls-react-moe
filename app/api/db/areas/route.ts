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
  ZoneManhalCode?: string | null; // For Dubai/Northern enrichment
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
      // Abu Dhabi: direct filter on ZoneId with IsActive = 1
      rows = (await prisma.$queryRaw(
        Prisma.sql`SELECT Id, TitleAr, TitleEn, IsActive, ZoneId, ManhalCode
                   FROM Areas
                   WHERE IsActive = CAST(1 AS bit) AND ZoneId = ${zoneId}
                   ORDER BY TitleAr ASC`
      )) as AreaRow[];
    } else {
      // Dubai/Northern Emirates: direct filter on ZoneId with IsActive = 1
      // Include Zone.ManhalCode for enrichment
      rows = (await prisma.$queryRaw(
        Prisma.sql`SELECT A.Id, A.TitleAr, A.TitleEn, A.IsActive, A.ZoneId, A.ManhalCode, Z.ManhalCode AS ZoneManhalCode
                   FROM Areas A
                   INNER JOIN Zones Z ON Z.Id = A.ZoneId
                   WHERE A.IsActive = CAST(1 AS bit) AND A.ZoneId = ${zoneId}
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
