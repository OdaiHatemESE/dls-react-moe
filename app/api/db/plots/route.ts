/**
 * GET /api/db/plots
 *
 * Returns ManhalCodes from the entire hierarchy (Area → Zone → Region → Emirate) based on GISID lookup.
 *
 * Query parameters:
 * - filter: string (required) — GISID suffix to match against PremisesPlotId (SQL LIKE '%{filter}').
 *
 * Behavior:
 * - Matches PremisesPlotId LIKE '%{filter}'.
 * - Fetches the full hierarchy: Plot → Area → Zone → Region → Emirate
 * - Returns all ManhalCodes from each level of the hierarchy
 *
 * Response:
 * {
 *   data: {
 *     areaId: number,
 *     areaManhalCode: string | null,
 *     zoneId: number,
 *     zoneManhalCode: string | null,
 *     regionId: number,
 *     regionManhalCode: string | null,
 *     emirateId: number,
 *     emirateManhalCode: string | null
 *   },
 *   meta: { filter: string, count: number }
 * }
 *
 * Examples:
 * - /api/db/plots?filter=100041172
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client-student-registration";


export const dynamic = "force-dynamic";

type HierarchyRow = {
  AreaId: number;
  AreaManhalCode: string | null;
  ZoneId: number;
  ZoneManhalCode: string | null;
  RegionId: number;
  RegionManhalCode: string | null;
  EmirateId: number;
  EmirateManhalCode: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "").trim();

    if (!filter) {
      return NextResponse.json({ error: "Missing required query parameter: filter (GISID)" }, { status: 400 });
    }

    // Fetch ManhalCodes from the entire hierarchy: Plot → Area → Zone → Region → Emirate
    const likeParam = `%${filter}`;
    const rows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT TOP 1
          a.Id AS AreaId,
          a.ManhalCode AS AreaManhalCode,
          z.Id AS ZoneId,
          z.ManhalCode AS ZoneManhalCode,
          r.Id AS RegionId,
          r.ManhalCode AS RegionManhalCode,
          e.Id AS EmirateId,
          e.ManhalCode AS EmirateManhalCode
        FROM Plots p
        INNER JOIN Areas a ON a.Id = p.AreaId
        INNER JOIN Zones z ON z.Id = a.ZoneId
        INNER JOIN Regions r ON r.Id = z.RegionId
        INNER JOIN Emirates e ON e.Id = r.EmirateId
        WHERE p.PremisesPlotId LIKE ${likeParam}
      `
    )) as HierarchyRow[];

    if (rows.length === 0) {
      return NextResponse.json({ 
        error: "No plot found matching the provided GISID" 
      }, { status: 404 });
    }

    const result = rows[0];

    return NextResponse.json({ 
      data: {
        areaId: result.AreaId,
        areaManhalCode: result.AreaManhalCode,
        zoneId: result.ZoneId,
        zoneManhalCode: result.ZoneManhalCode,
        regionId: result.RegionId,
        regionManhalCode: result.RegionManhalCode,
        emirateId: result.EmirateId,
        emirateManhalCode: result.EmirateManhalCode,
      },
      meta: { 
        filter, 
        count: 1 
      } 
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
