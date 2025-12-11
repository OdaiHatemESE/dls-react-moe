import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalPrisma } from "@prisma/client-parent-portal";
import { metricsTracker } from '@/lib/metrics-tracker';

const prisma = new ParentPortalPrisma();

// GET all update periods
export async function GET() {
  const startTime = Date.now();
  const endpoint = '/api/admin/config/periods';
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const periods = await prisma.updatePeriodConfig.findMany({
      orderBy: { startDate: "desc" },
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json(periods);
  } catch (error) {
    console.error("Error fetching update periods:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to fetch update periods" },
      { status: 500 }
    );
  }
}

// POST create new update period
export async function POST(request: Request) {
  const startTime = Date.now();
  const endpoint = '/api/admin/config/periods';
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, startDate, endDate, isEnabled, description } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const period = await prisma.updatePeriodConfig.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        isEnabled: isEnabled ?? false,
        description: description || null,
        createdBy: session.user.emiratesId || session.user.id || "system",
      },
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json(period, { status: 201 });
  } catch (error) {
    console.error("Error creating update period:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to create update period" },
      { status: 500 }
    );
  }
}

// DELETE update period
export async function DELETE(request: Request) {
  const startTime = Date.now();
  const endpoint = '/api/admin/config/periods';
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Period ID is required" },
        { status: 400 }
      );
    }

    await prisma.updatePeriodConfig.delete({
      where: { id: parseInt(id) },
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({ message: "Period deleted successfully" });
  } catch (error) {
    console.error("Error deleting update period:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to delete update period" },
      { status: 500 }
    );
  }
}

// PATCH update period
export async function PATCH(request: Request) {
  const startTime = Date.now();
  const endpoint = '/api/admin/config/periods';
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Period ID is required" },
        { status: 400 }
      );
    }

    // Validate date range if both dates are being updated
    if (updates.startDate && updates.endDate) {
      const start = new Date(updates.startDate);
      const end = new Date(updates.endDate);
      if (start >= end) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Convert date strings to Date objects
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const period = await prisma.updatePeriodConfig.update({
      where: { id: parseInt(id) },
      data: updates,
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json(period);
  } catch (error) {
    console.error("Error updating period:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to update period" },
      { status: 500 }
    );
  }
}
