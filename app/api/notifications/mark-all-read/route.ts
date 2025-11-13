import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalClient } from "@prisma/client-parent-portal";

const prisma = new ParentPortalClient();

/**
 * POST /api/notifications/mark-all-read
 * 
 * Mark all notifications as read for the authenticated user.
 */
export async function POST(request: NextRequest) {
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

    // If no students found, also try parent's Emirates ID
    const userIds = studentIdentifiers.length > 0 
      ? studentIdentifiers 
      : [emiratesId];

    // Update all unread notifications
    const result = await prisma.notification.updateMany({
      where: {
        userId: { in: userIds },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Marked ${result.count} notifications as read`,
    });
  } catch (error) {
    console.error("[POST /api/notifications/mark-all-read] Error:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
