import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaParent } from "@/lib/prisma-parent";
import { metricsTracker } from '@/lib/metrics-tracker';

/**
 * GET /api/admin/analytics/updates
 * Returns recent student enrollment updates and activity
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/admin/analytics/updates';
  
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

    // Get students with information updates or conduct agreements
    const [students, totalCount] = await Promise.all([
      prismaParent.student.findMany({
        where: {
          OR: [
            { isInformationUpdated: true },
            { isConductAgreementSigned: true },
            { informationUpdateStatus: { not: null } },
          ],
        },
        select: {
          id: true,
          emirateId: true,
          firstNameEnglish: true,
          familyNameEnglish: true,
          firstNameArabic: true,
          lastNameArabic: true,
          status: true,
          updatedAt: true,
          isInformationUpdated: true,
          informationUpdatedAt: true,
          informationUpdateStatus: true,
          isConductAgreementSigned: true,
          conductAgreementSignedAt: true,
          username: true,
          studentNumber: true,
        },
        orderBy: [
          { informationUpdatedAt: { sort: "desc", nulls: "last" } },
          { conductAgreementSignedAt: { sort: "desc", nulls: "last" } },
          { updatedAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prismaParent.student.count({
        where: {
          OR: [
            { isInformationUpdated: true },
            { isConductAgreementSigned: true },
            { informationUpdateStatus: { not: null } },
          ],
        },
      }),
    ]);

    // Get information update statistics
    const [infoUpdateCount, conductSignedCount, bothCompletedCount, infoUpdateStatusCounts] = await Promise.all([
      prismaParent.student.count({
        where: { isInformationUpdated: true },
      }),
      prismaParent.student.count({
        where: { isConductAgreementSigned: true },
      }),
      prismaParent.student.count({
        where: {
          isInformationUpdated: true,
          isConductAgreementSigned: true,
        },
      }),
      prismaParent.student.groupBy({
        by: ["informationUpdateStatus"],
        where: {
          informationUpdateStatus: { not: null },
        },
        _count: true,
      }),
    ]);

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({
      students,
      stats: {
        total: totalCount,
        infoUpdated: infoUpdateCount,
        conductSigned: conductSignedCount,
        bothCompleted: bothCompletedCount,
        pendingInfo: infoUpdateCount > 0 ? totalCount - infoUpdateCount : 0,
        pendingConduct: conductSignedCount > 0 ? totalCount - conductSignedCount : 0,
        byStatus: infoUpdateStatusCounts.map(s => ({
          status: s.informationUpdateStatus,
          count: s._count,
        })),
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
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to fetch update analytics" },
      { status: 500 }
    );
  }
}
