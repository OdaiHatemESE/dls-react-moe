import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaParent } from "@/lib/prisma-parent";

/**
 * GET /api/admin/analytics/students
 * Returns comprehensive student list with all information
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

    // Get query parameters for pagination and filtering
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { emirateId: { contains: search } },
            { firstNameEnglish: { contains: search } },
            { familyNameEnglish: { contains: search } },
            { firstNameArabic: { contains: search } },
            { studentNumber: { contains: search } },
            { username: { contains: search } },
          ],
        }
      : {};

    // Get students with all related data
    const [students, totalCount, updateStats] = await Promise.all([
      prismaParent.student.findMany({
        where: whereClause,
        include: {
          StudentAddress: true,
          StudentContact: true,
          StudentEnrollment: {
            include: {},
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prismaParent.student.count({ where: whereClause }),
      // Get aggregate stats for information updates
      prismaParent.student.aggregate({
        where: whereClause,
        _count: {
          isInformationUpdated: true,
          isConductAgreementSigned: true,
        },
      }),
    ]);

    // Count students with information updated in the current result set
    const studentsUpdated = students.filter(s => s.isInformationUpdated).length;
    const studentsWithConduct = students.filter(s => s.isConductAgreementSigned).length;

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        currentPage: {
          total: students.length,
          updated: studentsUpdated,
          conductSigned: studentsWithConduct,
        },
      },
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Admin Analytics - Students]", error);
    return NextResponse.json(
      { error: "Failed to fetch student analytics" },
      { status: 500 }
    );
  }
}
