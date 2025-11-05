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
      totalAdmins,
      activeAdmins,
      totalPeriods,
      activePeriods,
      totalActions,
      activeActions,
      totalAcademicYears,
      activeAcademicYears,
      recentStudents,
      recentEnrollments,
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
      
      // Admin counts
      prismaParent.adminUser.count(),
      prismaParent.adminUser.count({ where: { isActive: true } }),
      
      // Config counts
      prismaParent.updatePeriodConfig.count(),
      prismaParent.updatePeriodConfig.count({ where: { isEnabled: true } }),
      prismaParent.studentActionConfig.count(),
      prismaParent.studentActionConfig.count({ where: { isEnabled: true } }),
      prismaParent.academicYearConfig.count(),
      prismaParent.academicYearConfig.count({ where: { isActive: true } }),
      
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
          status: true,
        },
      }),
      prismaParent.studentEnrollment.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orEnrollmentId: true,
          schoolId: true,
          streamGradeId: true,
          entryDate: true,
          createdAt: true,
          Student: {
            select: {
              emirateId: true,
              firstNameEnglish: true,
              familyNameEnglish: true,
            },
          },
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

    // Information update statistics
    const studentsWithInfoUpdated = await prismaParent.student.count({
      where: { isInformationUpdated: true },
    });

    const studentsWithConductSigned = await prismaParent.student.count({
      where: { isConductAgreementSigned: true },
    });

    // Information update status breakdown
    const infoUpdateStatusBreakdown = await prismaParent.student.groupBy({
      by: ["informationUpdateStatus"],
      _count: true,
      where: {
        informationUpdateStatus: { not: null },
      },
    });

    // Recent information updates
    const recentInfoUpdates = await prismaParent.student.findMany({
      where: {
        isInformationUpdated: true,
        informationUpdatedAt: { not: null },
      },
      orderBy: { informationUpdatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        emirateId: true,
        firstNameEnglish: true,
        familyNameEnglish: true,
        informationUpdatedAt: true,
        informationUpdateStatus: true,
        isConductAgreementSigned: true,
        conductAgreementSignedAt: true,
      },
    });

    // Recent conduct agreement signatures
    const recentConductSignatures = await prismaParent.student.findMany({
      where: {
        isConductAgreementSigned: true,
        conductAgreementSignedAt: { not: null },
      },
      orderBy: { conductAgreementSignedAt: "desc" },
      take: 10,
      select: {
        id: true,
        emirateId: true,
        firstNameEnglish: true,
        familyNameEnglish: true,
        conductAgreementSignedAt: true,
        informationUpdateStatus: true,
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
        informationUpdates: {
          total: totalStudents,
          updated: studentsWithInfoUpdated,
          pending: totalStudents - studentsWithInfoUpdated,
          updateRate: totalStudents > 0 ? ((studentsWithInfoUpdated / totalStudents) * 100).toFixed(2) : "0.00",
          withConductSigned: studentsWithConductSigned,
          conductSignRate: totalStudents > 0 ? ((studentsWithConductSigned / totalStudents) * 100).toFixed(2) : "0.00",
          byStatus: infoUpdateStatusBreakdown.map((s) => ({
            status: s.informationUpdateStatus,
            count: s._count,
          })),
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
          academicYears: {
            total: totalAcademicYears,
            active: activeAcademicYears,
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
        recentEnrollments: recentEnrollments,
        recentInfoUpdates: recentInfoUpdates,
        recentConductSignatures: recentConductSignatures,
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
