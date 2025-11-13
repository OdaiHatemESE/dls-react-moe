# Integration Examples

This document shows how to integrate the notification system into your existing API routes and workflows.

## Example 1: Send Notification After Student Update

```typescript
// app/api/student/[id]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.emiratesId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Update student logic here...
    const student = await updateStudent(params.id, data);

    // Send notification
    await createNotification({
      userId: session.user.emiratesId,
      ...NotificationTemplates.informationUpdated(
        student.name,
        student.id
      ),
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("Error updating student:", error);
    
    // Send error notification
    await createNotification({
      userId: session.user.emiratesId,
      ...NotificationTemplates.systemError(
        "Failed to update student information. Please try again."
      ),
    });
    
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}
```

## Example 2: Bulk Notification for Announcements

```typescript
// app/api/admin/announcements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createBulkNotifications, NotificationTemplates } from "@/lib/notifications";
import { PrismaClient as ParentPortalClient } from "@prisma/client-parent-portal";

const prisma = new ParentPortalClient();

export async function POST(request: NextRequest) {
  try {
    const { title, body, targetGrade } = await request.json();

    // Get all parent Emirates IDs (or filter by grade, school, etc.)
    const parents = await prisma.parent.findMany({
      where: targetGrade ? {
        Student: {
          some: {
            StudentEnrollment: {
              some: {
                streamGradeId: targetGrade,
              },
            },
          },
        },
      } : undefined,
      select: {
        identifier: true, // Emirates ID
      },
    });

    const parentIds = parents
      .map((p) => p.identifier)
      .filter((id): id is string => Boolean(id));

    // Send bulk notification
    const result = await createBulkNotifications({
      userIds: parentIds,
      ...NotificationTemplates.announcement(title, body, "/announcements"),
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Sent to ${result.count} parents`,
    });
  } catch (error) {
    console.error("Error sending announcement:", error);
    return NextResponse.json(
      { error: "Failed to send announcement" },
      { status: 500 }
    );
  }
}
```

## Example 3: Auto-notify on Conduct Agreement Signing

```typescript
// app/api/child/[id]/conduct/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.emiratesId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Sign conduct agreement logic...
    await signConductAgreement(params.id);

    // Send success notification
    await createNotification({
      userId: session.user.emiratesId,
      type: "success",
      title: "Conduct Agreement Signed",
      body: "You have successfully signed the conduct agreement.",
      data: {
        link: `/child/${params.id}`,
        studentId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error signing conduct:", error);
    return NextResponse.json(
      { error: "Failed to sign conduct agreement" },
      { status: 500 }
    );
  }
}
```

## Example 4: Scheduled Notifications (Cron Job)

```typescript
// app/api/cron/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createBulkNotifications, NotificationTemplates } from "@/lib/notifications";
import { PrismaClient as ParentPortalClient } from "@prisma/client-parent-portal";

const prisma = new ParentPortalClient();

/**
 * Cron job to send reminder notifications
 * Run daily to check for pending actions
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (security)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find parents with unsigned conduct agreements
    const pendingConduct = await prisma.student.findMany({
      where: {
        isConductAgreementSigned: false,
        Parent: {
          identifier: { not: null },
        },
      },
      include: {
        Parent: {
          select: {
            identifier: true,
          },
        },
      },
    });

    // Group by parent
    const parentNotifications = new Map<string, string[]>();
    
    for (const student of pendingConduct) {
      const parentId = student.Parent?.identifier;
      if (!parentId) continue;
      
      if (!parentNotifications.has(parentId)) {
        parentNotifications.set(parentId, []);
      }
      parentNotifications.get(parentId)?.push(student.firstNameEnglish || "Student");
    }

    // Send notifications
    let count = 0;
    for (const [parentId, studentNames] of parentNotifications) {
      await createNotification({
        userId: parentId,
        type: "warning",
        title: "Conduct Agreement Reminder",
        body: `You have ${studentNames.length} pending conduct agreement(s) to sign for: ${studentNames.join(", ")}.`,
        data: {
          link: "/dashboard",
          action: "sign_conduct",
        },
      });
      count++;
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${count} reminder notifications`,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
```

## Example 5: Notification on Update Period Start

```typescript
// app/api/admin/update-period/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createBulkNotifications, NotificationTemplates } from "@/lib/notifications";
import { PrismaClient as ParentPortalClient } from "@prisma/client-parent-portal";

const prisma = new ParentPortalClient();

export async function POST(request: NextRequest) {
  try {
    const { configId } = await request.json();

    // Get update period config
    const config = await prisma.updatePeriodConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    // Enable the update period
    await prisma.updatePeriodConfig.update({
      where: { id: configId },
      data: { isEnabled: true },
    });

    // Get all parent IDs
    const parents = await prisma.parent.findMany({
      where: { identifier: { not: null } },
      select: { identifier: true },
    });

    const parentIds = parents
      .map((p) => p.identifier)
      .filter((id): id is string => Boolean(id));

    // Send notification to all parents
    const endDate = new Date(config.endDate).toLocaleDateString();
    const result = await createBulkNotifications({
      userIds: parentIds,
      ...NotificationTemplates.updatePeriodActive(endDate),
    });

    return NextResponse.json({
      success: true,
      notificationsSent: result.count,
    });
  } catch (error) {
    console.error("Error starting update period:", error);
    return NextResponse.json(
      { error: "Failed to start update period" },
      { status: 500 }
    );
  }
}
```

## Example 6: Client-Side Notification Trigger

```typescript
// app/components/StudentForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/student/${studentId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Notification is automatically sent by the API route
        router.push("/dashboard");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Error:", error);
      // Error notification is automatically sent by the API route
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Example 7: Cleanup Old Notifications (Maintenance)

```typescript
// app/api/cron/cleanup-notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cleanupOldNotifications } from "@/lib/notifications";

/**
 * Cron job to clean up old read notifications
 * Run weekly to keep database clean
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete read notifications older than 30 days
    const result = await cleanupOldNotifications(30);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Cleaned up ${result.count} old notifications`,
    });
  } catch (error) {
    console.error("Error cleaning notifications:", error);
    return NextResponse.json(
      { error: "Failed to cleanup notifications" },
      { status: 500 }
    );
  }
}
```

## Example 8: Testing Notifications (Dev Tool)

```typescript
// app/api/dev/test-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import type { NotificationType } from "@/types";

/**
 * Dev-only route for testing notifications
 * Remove in production or protect with auth
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.emiratesId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, title, body, link } = await request.json();

  await createNotification({
    userId: session.user.emiratesId,
    type: (type as NotificationType) || "info",
    title: title || "Test Notification",
    body: body || "This is a test notification",
    data: link ? { link } : {},
  });

  return NextResponse.json({ success: true });
}
```

## Environment Variables

Add to `.env.local` for cron jobs:

```bash
# Cron job authentication
CRON_SECRET=your-secure-random-string-here
```

## Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/cleanup-notifications",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

## Summary

These examples show how to:
- ✅ Send notifications after user actions
- ✅ Bulk notify multiple users
- ✅ Schedule automated reminders
- ✅ Handle errors with notifications
- ✅ Trigger notifications from admin actions
- ✅ Clean up old notifications
- ✅ Test notifications during development

Integrate these patterns into your existing workflows to keep users informed!
