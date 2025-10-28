import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaParent } from "@/lib/prisma-parent";

/**
 * GET /api/admin/analytics/stats
 * Returns comprehensive database statistics
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

    // Get comprehensive statistics in parallel
    const [
      totalStudents,
      activeStudents,
      totalEnrollments,
      totalAddresses,
      totalContacts,
      totalUpdateRequests,
      completedUpdates,
      pendingUpdates,
      totalAdmins,
      activeAdmins,
      totalPeriods,
      activePeriods,
      totalActions,
      activeActions,
      recentStudents,
      recentUpdates,
      genderBreakdown,
      religionBreakdown,
      citizenshipBreakdown,
    ] = await Promise.all([
      // Student counts
      prismaParent.student.count(),
      prismaParent.student.count({ where: { status: "active" } }),
      
      // Related data counts
      prismaParent.studentEnrollment.count(),
      prismaParent.studentAddress.count(),
      prismaParent.studentContact.count(),
      
      // Update request counts
      prismaParent.updateInformationRequests.count(),
      prismaParent.updateInformationRequests.count({
        where: { infoUpdateRequestStatus: 2 },
      }),
      prismaParent.updateInformationRequests.count({
        where: { infoUpdateRequestStatus: 1 },
      }),
      
      // Admin counts
      prismaParent.adminUser.count(),
      prismaParent.adminUser.count({ where: { isActive: true } }),
      
      // Config counts
      prismaParent.updatePeriodConfig.count(),
      prismaParent.updatePeriodConfig.count({ where: { isEnabled: true } }),
      prismaParent.studentActionConfig.count(),
      prismaParent.studentActionConfig.count({ where: { isEnabled: true } }),
      
      // Recent activity
      prismaParent.student.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          emirateId: true,
          firstNameEnglish: true,
          familyNameEnglish: true,
          createdAt: true,
        },
      }),
      prismaParent.updateInformationRequests.findMany({
        orderBy: { updateAt: "desc" },
        take: 5,
        select: {
          studentEmirateId: true,
          parentPersonId: true,
          infoUpdateRequestStatus: true,
          updateAt: true,
        },
      }),
      
      // Demographic breakdowns
      prismaParent.student.groupBy({
        by: ["gender"],
        _count: true,
      }),
      prismaParent.student.groupBy({
        by: ["religion"],
        _count: true,
      }),
      prismaParent.student.groupBy({
        by: ["CitizenshipStatus"],
        _count: true,
      }),
    ]);

    // Calculate percentages and trends
    const studentsWithAddresses = await prismaParent.student.count({
      where: {
        StudentAddress: {
          some: {},
        },
      },
    });

    const studentsWithContacts = await prismaParent.student.count({
      where: {
        StudentContact: {
          some: {},
        },
      },
    });

    const studentsWithEnrollments = await prismaParent.student.count({
      where: {
        StudentEnrollment: {
          some: {},
        },
      },
    });

    return NextResponse.json({
      overview: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
          withAddress: studentsWithAddresses,
          withContact: studentsWithContacts,
          withEnrollment: studentsWithEnrollments,
        },
        updates: {
          total: totalUpdateRequests,
          completed: completedUpdates,
          pending: pendingUpdates,
          completionRate: totalUpdateRequests > 0 
            ? ((completedUpdates / totalUpdateRequests) * 100).toFixed(2)
            : "0",
        },
        system: {
          admins: {
            total: totalAdmins,
            active: activeAdmins,
          },
          periods: {
            total: totalPeriods,
            active: activePeriods,
          },
          actions: {
            total: totalActions,
            enabled: activeActions,
          },
        },
      },
      demographics: {
        gender: genderBreakdown.map((g) => ({
          type: g.gender || "Unknown",
          count: g._count,
        })),
        religion: religionBreakdown.map((r) => ({
          type: r.religion || "Unknown",
          count: r._count,
        })),
        citizenship: citizenshipBreakdown.map((c) => ({
          type: c.CitizenshipStatus || "Unknown",
          count: c._count,
        })),
      },
      recentActivity: {
        newStudents: recentStudents,
        recentUpdates: recentUpdates,
      },
      counts: {
        totalEnrollments,
        totalAddresses,
        totalContacts,
      },
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Analytics - Stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch system statistics" },
      { status: 500 }
    );
  }
}
