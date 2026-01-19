/**
 * GET /api/db/plots
 *
 * Returns ManhalCodes from the entire hierarchy (Area → Zone → Region → Emirate) based on GISID lookup.
 * Uses AuhAddresses table (updated and refreshed address authority data).
 *
 * Query parameters:
 * - filter: string (required) — GISID suffix to match against PlotId or PlotNumber (SQL LIKE '%{filter}').
 *
 * Behavior:
 * - Matches PlotId or PlotNumber LIKE '%{filter}' in AuhAddresses table
 * - Fetches the full hierarchy: Sector (Area) → Region (Zone) → City (Region) → State (Emirate)
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
  SectorId: number;
  SectorCode: string | null;
  RegionId: number;
  RegionCode: string | null;
  CityId: number;
  CityCode: string | null;
  StateId: number;
  StateCode: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "").trim();

    if (!filter) {
      return NextResponse.json({ error: "Missing required query parameter: filter (GISID)" }, { status: 400 });
    }
    // Fetch ManhalCodes from the entire hierarchy using AuhAddresses (updated address authority data)
    // Search in PlotId or PlotNumber
    const likeParam = `%${filter}`;
    const rows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT TOP 1
          SectorId,
          SectorCode,
          RegionId,
          RegionCode,
          CityId,
          CityCode,
          StateId,
          StateCode
        FROM AuhAddresses
        WHERE PlotId LIKE ${likeParam}
           OR PlotNumber LIKE ${likeParam}
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
        areaId: result.SectorId,
        areaManhalCode: result.SectorCode,
        zoneId: result.RegionId,
        zoneManhalCode: result.RegionCode,
        regionId: result.CityId,
        regionManhalCode: result.CityCode,
        emirateId: result.StateId,
        emirateManhalCode: result.StateCode,
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
