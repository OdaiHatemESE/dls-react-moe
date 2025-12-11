import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalClient } from "@prisma/client-parent-portal";
import { metricsTracker } from '@/lib/metrics-tracker';

const prisma = new ParentPortalClient();

/**
 * PATCH /api/notifications/[id]/read
 * 
 * Mark a specific notification as read.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const endpoint = '/api/notifications/[id]/read';
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.emiratesId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const notificationId = parseInt(id);
    const emiratesId = session.user.emiratesId;

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "Invalid notification ID" },
        { status: 400 }
      );
    }

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

    // Verify notification belongs to user (check against all student identifiers)
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: { in: userIds },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Update to read
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({
      notification: {
        ...updated,
        data: JSON.parse(updated.data),
      },
    });
  } catch (error) {
    console.error(`[PATCH /api/notifications/[id]/read] Error:`, error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
