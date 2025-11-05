import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaParent } from "@/lib/prisma-parent";

/**
 * GET /api/admin/analytics/updates
 * Returns recent student enrollment updates and activity
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.emiratesId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prismaParent.adminUser.findFirst({
      where: {
        emirateId: session.user.emiratesId,
        isActive: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Get recent enrollments with student data
    const [enrollments, totalCount] = await Promise.all([
      prismaParent.studentEnrollment.findMany({
        include: {
          Student: {
            select: {
              id: true,
              emirateId: true,
              firstNameEnglish: true,
              familyNameEnglish: true,
              status: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prismaParent.studentEnrollment.count(),
    ]);

    // Get enrollment statistics
    const stats = await prismaParent.studentEnrollment.groupBy({
      by: ["type"],
      _count: true,
    });

    const enrollmentStats = {
      total: totalCount,
      byType: stats.map((s) => ({
        type: s.type || "Unknown",
        count: s._count,
      })),
    };

    // Get count of active enrollments
    const activeCount = await prismaParent.studentEnrollment.count({
      where: {
        exitDate: null,
      },
    });

    return NextResponse.json({
      enrollments,
      stats: {
        ...enrollmentStats,
        active: activeCount,
        inactive: totalCount - activeCount,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Analytics - Updates]", error);
    return NextResponse.json(
      { error: "Failed to fetch update analytics" },
      { status: 500 }
    );
  }
}
