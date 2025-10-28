import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaParent } from "@/lib/prisma-parent";

/**
 * GET /api/admin/analytics/updates
 * Returns all update requests with parent information
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
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (status) {
      whereClause.infoUpdateRequestStatus = parseInt(status);
    }

    // Get update requests
    const [updateRequests, totalCount] = await Promise.all([
      prismaParent.updateInformationRequests.findMany({
        where: whereClause,
        orderBy: { updateAt: "desc" },
        skip,
        take: limit,
      }),
      prismaParent.updateInformationRequests.count({ where: whereClause }),
    ]);

    // Get statistics
    const stats = await prismaParent.updateInformationRequests.groupBy({
      by: ["infoUpdateRequestStatus"],
      _count: true,
    });

    const statusCounts = {
      total: totalCount,
      requested: 0,
      completed: 0,
      pending: 0,
      withConductAgreement: 0,
    };

    stats.forEach((stat) => {
      if (stat.infoUpdateRequestStatus === 1) statusCounts.pending = stat._count;
      if (stat.infoUpdateRequestStatus === 2) statusCounts.completed = stat._count;
      if (stat.infoUpdateRequestStatus === 3) statusCounts.requested = stat._count;
    });

    // Count conduct agreements
    const conductCount = await prismaParent.updateInformationRequests.count({
      where: { isConductAgreementSigned: true },
    });
    statusCounts.withConductAgreement = conductCount;

    return NextResponse.json({
      updates: updateRequests,
      stats: statusCounts,
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
