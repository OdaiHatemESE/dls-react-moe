import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalClient } from "@prisma/client-parent-portal";
import { metricsTracker } from '@/lib/metrics-tracker';

const prisma = new ParentPortalClient();

/**
 * GET /api/notifications/count
 * 
 * Get notification counts for the authenticated user.
 * 
 * Returns:
 * - total: total number of notifications
 * - unread: number of unread notifications
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/notifications/count';
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.emiratesId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const emiratesId = session.user.emiratesId;

    // Get all students for this parent
    const students = await prisma.student.findMany({
      where: {
        Parent: {
          identifier: emiratesId
        }
      },
      select: {
        studentNumber: true,
        emirateId: true,
      },
    });

    // Get student numbers and emirate IDs to query notifications
    const studentIdentifiers = students.flatMap(s => [
      s.studentNumber,
      s.emirateId,
    ].filter(Boolean) as string[]);

    // If no students found, also try to query by parent's Emirates ID
    const userIds = studentIdentifiers.length > 0 
      ? studentIdentifiers 
      : [emiratesId];

    // Get counts
    const [total, unread] = await Promise.all([
      prisma.notification.count({
        where: { userId: { in: userIds } },
      }),
      prisma.notification.count({
        where: { userId: { in: userIds }, isRead: false },
      }),
    ]);

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({
      total,
      unread,
    });
  } catch (error) {
    console.error("[GET /api/notifications/count] Error:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
