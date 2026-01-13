import { NextResponse } from "next/server";
import { getActiveAcademicYearValue } from "@/lib/admin-config";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/active-academic-year
 * Returns the active academic year value from admin config
 */
export async function GET() {
  try {
    const yearValue = await getActiveAcademicYearValue();
    
    if (!yearValue) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "No active academic year configured",
          data: null 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { yearValue },
    });
  } catch (error) {
    console.error("Error fetching active academic year:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        data: null 
      },
      { status: 500 }
    );
  }
}
