import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalClient } from "@prisma/client-parent-portal";
import type { NotificationFilter } from "@/types";
import { metricsTracker } from '@/lib/metrics-tracker';

const prisma = new ParentPortalClient();

/**
 * GET /api/notifications
 * 
 * Fetch notifications for the authenticated user.
 * 
 * Query params:
 * - status: "all" | "read" | "unread" (default: "all")
 * - type: notification type filter
 * - limit: max results (default: 50)
 * - offset: pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/notifications';
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.emiratesId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "all") as NotificationFilter["status"];
    const type = searchParams.get("type") as NotificationFilter["type"];
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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
        firstNameEnglish: true,
        middleNameEnglish: true,
        thirdNameEnglish: true,
        fourthNameEnglish: true,
        familyNameEnglish: true,
        firstNameArabic: true,
        middleNameArabic: true,
        lastNameArabic: true,
      },
    });

    // Create a map of student identifiers to student names
    const studentNameMap = new Map<string, { nameEn: string; nameAr: string }>();
    students.forEach(s => {
      const nameEn = [s.firstNameEnglish, s.middleNameEnglish, s.familyNameEnglish]
        .filter(Boolean)
        .join(' ') || 'Student';
      const nameAr = [s.firstNameArabic, s.middleNameArabic, s.lastNameArabic]
        .filter(Boolean)
        .join(' ') || 'طالب';
      
      if (s.studentNumber) {
        studentNameMap.set(s.studentNumber, { nameEn, nameAr });
      }
      if (s.emirateId) {
        studentNameMap.set(s.emirateId, { nameEn, nameAr });
      }
    });

    // Get student numbers and emirate IDs to query notifications
    const studentIdentifiers = students.flatMap(s => [
      s.studentNumber,
      s.emirateId,
    ].filter(Boolean) as string[]);

    // If no students found, also try to query by parent's Emirates ID
    // in case notifications are sent directly to parent
    const userIds = studentIdentifiers.length > 0 
      ? studentIdentifiers 
      : [emiratesId];

    // Build where clause
    const where: any = { 
      userId: { in: userIds }
    };
    
    if (status === "read") {
      where.isRead = true;
    } else if (status === "unread") {
      where.isRead = false;
    }
    
    if (type) {
      where.type = type;
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Parse data field from JSON string and add student name
    const formattedNotifications = notifications.map((n) => {
      const parsedData = n.data ? JSON.parse(n.data) : {};
      const studentInfo = studentNameMap.get(n.userId);
      
      return {
        ...n,
        data: parsedData,
        studentName: studentInfo?.nameEn || null,
        studentNameAr: studentInfo?.nameAr || null,
      };
    });

    // Deduplicate: If StatusChange and DataUpdate exist for same sourceHistoryId within 1 minute,
    // keep only StatusChange (more specific)
    const deduplicatedNotifications = formattedNotifications.filter((notif, index, arr) => {
      // Only check for DataUpdate notifications
      if (notif.type !== 'DataUpdate') return true;
      
      const sourceHistoryId = notif.data?.sourceHistoryId;
      if (!sourceHistoryId) return true; // Keep if no sourceHistoryId
      
      // Check if there's a StatusChange notification for the same sourceHistoryId within 1 minute
      const hasStatusChange = arr.some((other, otherIndex) => {
        if (otherIndex === index) return false; // Skip self
        if (other.type !== 'StatusChange') return false;
        if (other.data?.sourceHistoryId !== sourceHistoryId) return false;
        
        // Check if created within 1 minute of each other
        const timeDiff = Math.abs(
          new Date(notif.createdAt).getTime() - new Date(other.createdAt).getTime()
        );
        return timeDiff < 60000; // 60 seconds
      });
      
      // If StatusChange exists for same event, filter out this DataUpdate
      return !hasStatusChange;
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({
      notifications: deduplicatedNotifications,
      total: await prisma.notification.count({ where }),
    });
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 
 * Create a new notification (admin/system use).
 * 
 * Body:
 * - userId: string
 * - type: string
 * - title: string
 * - body: string
 * - data: object (optional)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/notifications';
  
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users (you may want to add admin check)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, type, title, body: notificationBody, data } = body;

    if (!userId || !type || !title || !notificationBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body: notificationBody,
        data: JSON.stringify(data || {}),
        isRead: false,
      },
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({
      notification: {
        ...notification,
        data: JSON.parse(notification.data),
      },
    });
  } catch (error) {
    console.error("[POST /api/notifications] Error:", error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
