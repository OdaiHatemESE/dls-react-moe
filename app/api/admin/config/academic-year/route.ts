import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalPrisma } from "@prisma/client-parent-portal";
import { metricsTracker } from '@/lib/metrics-tracker';

const prisma = new ParentPortalPrisma();

// GET all academic years or get active academic year
export async function GET(request: Request) {
  const startTime = Date.now();
  const endpoint = '/api/admin/config/academic-year';
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    if (activeOnly) {
      const activeYear = await prisma.academicYearConfig.findFirst({
        where: { isActive: true },
      });
      metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
      return NextResponse.json(activeYear);
    }

    const academicYears = await prisma.academicYearConfig.findMany({
      orderBy: { yearValue: "desc" },
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json(academicYears);
  } catch (error) {
    console.error("Error fetching academic years:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to fetch academic years" },
      { status: 500 }
    );
  }
}

// POST create new academic year (or initialize default years)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { academicYear, yearValue, isActive, description, initializeDefaults } = body;

    // Initialize default years if requested
    if (initializeDefaults) {
      const currentYear = new Date().getFullYear();
      const startYear = 2025;
      const years = [];

      for (let i = 0; i < 6; i++) {
        const year = startYear + i;
        const nextYear = year + 1;
        years.push({
          academicYear: `${year}-${nextYear}`,
          yearValue: nextYear,
          isActive: year === currentYear,
          description: `Academic year ${year}-${nextYear}`,
          createdBy: session.user.emiratesId || session.user.id || "system",
        });
      }

      // Check for existing years and insert only new ones
      const existingYears = await prisma.academicYearConfig.findMany({
        select: { academicYear: true },
      });
      const existingYearSet = new Set(existingYears.map(y => y.academicYear));
      const newYears = years.filter(y => !existingYearSet.has(y.academicYear));

      if (newYears.length > 0) {
        await prisma.academicYearConfig.createMany({
          data: newYears,
        });
      }

      const allYears = await prisma.academicYearConfig.findMany({
        orderBy: { yearValue: "desc" },
      });

      return NextResponse.json({ 
        message: "Default academic years initialized",
        years: allYears 
      }, { status: 201 });
    }

    // Create single academic year
    if (!academicYear || !yearValue) {
      return NextResponse.json(
        { error: "Academic year and year value are required" },
        { status: 400 }
      );
    }

    // If setting as active, deactivate all others first
    if (isActive) {
      await prisma.academicYearConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const year = await prisma.academicYearConfig.create({
      data: {
        academicYear,
        yearValue,
        isActive: isActive ?? false,
        description: description || null,
        createdBy: session.user.emiratesId || session.user.id || "system",
      },
    });

    return NextResponse.json(year, { status: 201 });
  } catch (error: any) {
    console.error("Error creating academic year:", error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Academic year already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create academic year" },
      { status: 500 }
    );
  }
}

// DELETE academic year
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Academic year ID is required" },
        { status: 400 }
      );
    }

    // Check if it's the active year
    const yearToDelete = await prisma.academicYearConfig.findUnique({
      where: { id: parseInt(id) },
    });

    if (yearToDelete?.isActive) {
      return NextResponse.json(
        { error: "Cannot delete the active academic year" },
        { status: 400 }
      );
    }

    await prisma.academicYearConfig.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Academic year deleted successfully" });
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return NextResponse.json(
      { error: "Failed to delete academic year" },
      { status: 500 }
    );
  }
}

// PATCH update academic year
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Academic year ID is required" },
        { status: 400 }
      );
    }

    // If setting as active, deactivate all others first
    if (isActive) {
      await prisma.academicYearConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const year = await prisma.academicYearConfig.update({
      where: { id: parseInt(id) },
      data: {
        ...updates,
        isActive: isActive ?? undefined,
      },
    });

    return NextResponse.json(year);
  } catch (error) {
    console.error("Error updating academic year:", error);
    return NextResponse.json(
      { error: "Failed to update academic year" },
      { status: 500 }
    );
  }
}
