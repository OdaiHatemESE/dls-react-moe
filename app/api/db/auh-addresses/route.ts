import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client-student-registration";

export const dynamic = "force-dynamic";

/**
 * GET /api/db/auh-addresses
 * 
 * Unified API for Abu Dhabi address hierarchy using AuhAddresses table.
 * Returns distinct values for Emirates, Regions, Zones, or Areas with ManhalCodes.
 * 
 * Query parameters:
 * - level: string (required) - "emirate" | "region" | "zone" | "area"
 * - stateId?: number - Filter by emirate (for regions)
 * - cityId?: number - Filter by region (for zones)
 * - regionId?: number - Filter by zone (for areas)
 * 
 * Examples:
 * - /api/db/auh-addresses?level=emirate
 * - /api/db/auh-addresses?level=region&stateId=1
 * - /api/db/auh-addresses?level=zone&cityId=1
 * - /api/db/auh-addresses?level=area&regionId=1
 */

type EmirateRow = {
  StateId: number;
  StateNameAr: string;
  StateNameEn: string;
  StateCode: string;
};

type RegionRow = {
  CityId: number;
  CityNameAr: string;
  CityNameEn: string;
  CityCode: string;
};

type ZoneRow = {
  RegionId: number;
  RegionNameAr: string;
  RegionNameEn: string;
  RegionCode: string;
};

type AreaRow = {
  SectorId: number;
  SectorNameAr: string;
  SectorNameEn: string;
  SectorCode: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level")?.toLowerCase();

    if (!level) {
      return NextResponse.json(
        { error: "Missing required query parameter: level (emirate|region|zone|area)" },
        { status: 400 }
      );
    }

    switch (level) {
      case "emirate": {
        // SELECT DISTINCT StateId, StateNameAr, StateNameEn, StateCode FROM AuhAddresses
        // Note: Removed IsActive filter since it may not be properly set in this table
        const emirates = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT StateId, StateNameAr, StateNameEn, StateCode
            FROM AuhAddresses
            ORDER BY StateNameEn ASC
          `
        )) as EmirateRow[];

        return NextResponse.json({
          data: emirates.map((e) => ({
            id: e.StateId,
            titleAr: e.StateNameAr,
            titleEn: e.StateNameEn,
            manhalCode: e.StateCode,
          })),
          meta: { level: "emirate", count: emirates.length },
        });
      }

      case "region": {
        const stateIdParam = searchParams.get("stateId");
        
        if (!stateIdParam) {
          return NextResponse.json(
            { error: "Missing required query parameter: stateId" },
            { status: 400 }
          );
        }

        const stateId = Number(stateIdParam);
        if (!Number.isFinite(stateId) || stateId <= 0) {
          return NextResponse.json({ error: "Invalid stateId" }, { status: 400 });
        }

        // SELECT DISTINCT CityId, CityNameAr, CityNameEn, CityCode FROM AuhAddresses WHERE StateId = ?
        const regions = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT CityId, CityNameAr, CityNameEn, CityCode
            FROM AuhAddresses
            WHERE StateId = ${stateId}
            ORDER BY CityNameEn ASC
          `
        )) as RegionRow[];

        return NextResponse.json({
          data: regions.map((r) => ({
            id: r.CityId,
            titleAr: r.CityNameAr,
            titleEn: r.CityNameEn,
            manhalCode: r.CityCode,
          })),
          meta: { level: "region", stateId, count: regions.length },
        });
      }

      case "zone": {
        const cityIdParam = searchParams.get("cityId");
        
        if (!cityIdParam) {
          return NextResponse.json(
            { error: "Missing required query parameter: cityId" },
            { status: 400 }
          );
        }

        const cityId = Number(cityIdParam);
        if (!Number.isFinite(cityId) || cityId <= 0) {
          return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
        }

        // SELECT DISTINCT RegionId, RegionNameAr, RegionNameEn, RegionCode FROM AuhAddresses WHERE CityId = ?
        const zones = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT RegionId, RegionNameAr, RegionNameEn, RegionCode
            FROM AuhAddresses
            WHERE CityId = ${cityId}
            ORDER BY RegionNameEn ASC
          `
        )) as ZoneRow[];

        return NextResponse.json({
          data: zones.map((z) => ({
            id: z.RegionId,
            titleAr: z.RegionNameAr,
            titleEn: z.RegionNameEn,
            manhalCode: z.RegionCode,
          })),
          meta: { level: "zone", cityId, count: zones.length },
        });
      }

      case "area": {
        const regionIdParam = searchParams.get("regionId");
        
        if (!regionIdParam) {
          return NextResponse.json(
            { error: "Missing required query parameter: regionId" },
            { status: 400 }
          );
        }

        const regionId = Number(regionIdParam);
        if (!Number.isFinite(regionId) || regionId <= 0) {
          return NextResponse.json({ error: "Invalid regionId" }, { status: 400 });
        }

        // SELECT DISTINCT SectorId, SectorNameAr, SectorNameEn, SectorCode FROM AuhAddresses WHERE RegionId = ?
        const areas = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT SectorId, SectorNameAr, SectorNameEn, SectorCode
            FROM AuhAddresses
            WHERE RegionId = ${regionId}
            ORDER BY SectorNameEn ASC
          `
        )) as AreaRow[];

        return NextResponse.json({
          data: areas.map((a) => ({
            id: a.SectorId,
            titleAr: a.SectorNameAr,
            titleEn: a.SectorNameEn,
            manhalCode: a.SectorCode,
          })),
          meta: { level: "area", regionId, count: areas.length },
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid level parameter. Must be: emirate, region, zone, or area" },
          { status: 400 }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
