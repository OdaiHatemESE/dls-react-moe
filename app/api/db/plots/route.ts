/**
 * GET /api/db/plots
 *
 * Returns plots by either GISID suffix (filter) or by AreaId, including nested Area → Zone → Region info
 * and a computed Onwani map mapping string.
 *
 * Query parameters:
 * - filter: string (optional) — GISID suffix to match against PremisesPlotId (SQL LIKE '%{filter}').
 * - areaId: number (optional) — Area Id to fetch all plots within that area.
 *   One of filter or areaId is required.
 *
 * Behavior:
 * - Ensures Plots.IsActive = 1 and Areas.IsActive = 1.
 * - If filter is provided, matches PremisesPlotId LIKE '%{filter}'.
 * - If areaId is provided, matches plots by AreaId.
 * - Computes mainPlotPromiseId by taking Plot_... at same coordinates when available.
 * - Builds onwaniMapMapping as:
 *   "{RegionId},{ZONE_TITLE_EN_UPPER},{PlotTitleEn},{mainPlotIdNoPrefix},{Longitude}-{Latitude}[,RoadNumber]"
 *   RoadNumber is appended only for AAM (Al Ain) municipality.
 *
 * Response:
 * {
 *   data: Array<{
 *     plot: { id, titles: { ar, en }, isActive },
 *     identifiers: { plotId, areaId, premisesPlotId, mainPlotPromiseId, mainPlotId },
 *     location: {
 *       coordinates: { latitude, longitude },
 *       roadNumber,
 *       onwani: { mapMapping, legacyKey }
 *     },
 *     hierarchy: {
 *       region: { id, emirateId, titles: { ar, en }, isActive },
 *       zone: { id, regionId, titles: { ar, en }, isActive },
 *       area: { id, zoneId, titles: { ar, en }, isActive, manhalCode }
 *     }
 *   }>,
 *   meta: { filter: string | "", areaId: number | null, count: number, mainPlotPromiseId: string }
 * }
 *
 * Examples:
 * - /api/db/plots?filter=100041172
 * - /api/db/plots?areaId=2315
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client-student-registration";


export const dynamic = "force-dynamic";

type PlotRow = {
  Id: number;
  TitleEn: string | null;
  TitleAr: string | null;
  IsActive: boolean | number | null;
  RoadNumber: string | null;
  PremisesPlotId: string | null;
  Latitude: string | null;
  Longitude: string | null;
  AreaId: number;
  AreaTitleEn: string | null;
  AreaTitleAr: string | null;
  AreaIsActive: boolean | number | null;
  AreaZoneId: number;
  AreaManhalCode: string | null;
  ZoneId: number;
  ZoneTitleEn: string | null;
  ZoneTitleAr: string | null;
  ZoneIsActive: boolean | number | null;
  RegionId: number;
  RegionTitleEn: string | null;
  RegionTitleAr: string | null;
  RegionIsActive: boolean | number | null;
  RegionEmirateId: number | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "").trim();
    const areaIdParam = searchParams.get("areaId");
    const areaId = areaIdParam ? Number(areaIdParam) : undefined;

    if (!filter && !(Number.isFinite(areaId) && (areaId as number) > 0)) {
      return NextResponse.json({ error: "Missing required query parameter: filter (GISID) or areaId" }, { status: 400 });
    }

    // Fetch plots matching PremisesPlotId ends with filter, ensure Plots.IsActive and Areas.IsActive
    const likeParam = `%${filter}`;
    const whereClause = filter
      ? Prisma.sql`p.IsActive = 1 AND a.IsActive = 1 AND p.PremisesPlotId LIKE ${likeParam}`
      : Prisma.sql`p.IsActive = 1 AND a.IsActive = 1 AND p.AreaId = ${areaId}`;
    const rows = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          p.Id,
          p.TitleEn,
          p.TitleAr,
          p.IsActive,
          p.RoadNumber,
          p.PremisesPlotId,
          p.Latitude,
          p.Longitude,
          p.AreaId,
          a.TitleEn AS AreaTitleEn,
          a.TitleAr AS AreaTitleAr,
          a.IsActive AS AreaIsActive,
          a.ZoneId AS AreaZoneId,
          a.ManhalCode AS AreaManhalCode,
          z.Id AS ZoneId,
          z.TitleEn AS ZoneTitleEn,
          z.TitleAr AS ZoneTitleAr,
          z.IsActive AS ZoneIsActive,
          r.Id AS RegionId,
          r.TitleEn AS RegionTitleEn,
          r.TitleAr AS RegionTitleAr,
          r.IsActive AS RegionIsActive,
          r.EmirateId AS RegionEmirateId
        FROM Plots p
        INNER JOIN Areas a ON a.Id = p.AreaId
        INNER JOIN Zones z ON z.Id = a.ZoneId
        INNER JOIN Regions r ON r.Id = z.RegionId
        WHERE ${whereClause}
        ORDER BY p.TitleEn ASC
      `
    )) as PlotRow[];

    let mainPlotPromiseId = "";
    if (rows.length > 0) {
      mainPlotPromiseId = rows[0].PremisesPlotId || "";
      const lat = rows[0].Latitude || null;
      const lng = rows[0].Longitude || null;
      if (lat && lng) {
        const main = (await prisma.$queryRaw(
          Prisma.sql`
            SELECT TOP 1 p.PremisesPlotId
            FROM Plots p
            INNER JOIN Areas a ON a.Id = p.AreaId
            WHERE p.IsActive = 1
              AND a.IsActive = 1
              AND p.Latitude = ${lat}
              AND p.Longitude = ${lng}
              AND p.PremisesPlotId LIKE 'Plot_%'
          `
        )) as Array<{ PremisesPlotId: string | null }>;
        if (main.length > 0 && main[0].PremisesPlotId) {
          mainPlotPromiseId = main[0].PremisesPlotId;
        }
      }
    }

    const toBool = (v: boolean | number | null | undefined): boolean => (typeof v === "number" ? v === 1 : Boolean(v));
    const mainPlotId = mainPlotPromiseId || "";
    const mainPlotIdNoPrefix = mainPlotId.replace(/^Plot_/i, "");

    const mapped = rows.map((x) => {
      const base = `${x.RegionId},${(x.ZoneTitleEn || "").toUpperCase()},${x.TitleEn || ""},${mainPlotIdNoPrefix},${x.Longitude || ""}-${x.Latitude || ""}`;
      // Append RoadNumber only for AAM (Al Ain) municipality to match existing business rules.
      const isAAM = (x.RegionTitleEn || "").toLowerCase().includes("ain");
      const onwani = isAAM && x.RoadNumber ? `${base},${x.RoadNumber}` : base;

      const region = {
        id: x.RegionId,
        titles: {
          ar: x.RegionTitleAr,
          en: x.RegionTitleEn,
        },
        isActive: toBool(x.RegionIsActive),
        emirateId: x.RegionEmirateId,
        emirate: null as null,
        manhalCode: null as string | null,
      };

      const zone = {
        id: x.ZoneId,
        titles: {
          ar: x.ZoneTitleAr,
          en: x.ZoneTitleEn,
        },
        isActive: toBool(x.ZoneIsActive),
        regionId: x.RegionId,
        region,
        manhalCode: null as string | null,
      };

      const area = {
        id: x.AreaId,
        titles: {
          ar: x.AreaTitleAr,
          en: x.AreaTitleEn,
        },
        isActive: toBool(x.AreaIsActive),
        manhalCode: x.AreaManhalCode,
        zoneId: x.AreaZoneId,
        zone,
        areaSchool: null as null,
      };

      const hierarchy = { region, zone, area };

      const identifiers = {
        plotId: x.Id,
        areaId: x.AreaId,
        premisesPlotId: x.PremisesPlotId,
        mainPlotPromiseId,
        mainPlotId: mainPlotIdNoPrefix,
      };

      const plot = {
        id: x.Id,
        titles: {
          ar: x.TitleAr,
          en: x.TitleEn,
        },
        isActive: toBool(x.IsActive),
      };

      const location = {
        coordinates: {
          latitude: x.Latitude,
          longitude: x.Longitude,
        },
        roadNumber: x.RoadNumber,
        onwani: {
          mapMapping: onwani,
          legacyKey: onwani,
        },
      };

      return {
        plot,
        identifiers,
        location,
        hierarchy,
      };
    });

    return NextResponse.json({ data: mapped, meta: { filter, areaId: areaId ?? null, count: mapped.length, mainPlotPromiseId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
