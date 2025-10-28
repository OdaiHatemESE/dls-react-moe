import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalPrisma } from "@prisma/client-parent-portal";

const prisma = new ParentPortalPrisma();

// Check if current user has admin access
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ hasAccess: false, reason: "Not authenticated" });
    }

    const emirateId = session.user.emiratesId;
    
    if (!emirateId) {
      return NextResponse.json({ hasAccess: false, reason: "No Emirates ID" });
    }

    // Normalize Emirates ID
    const normalizedEid = emirateId.replace(/[-\s]/g, "");

    // Check if user exists in AdminUser table and is active
    const adminUser = await prisma.adminUser.findUnique({
      where: { emirateId: normalizedEid },
    });

    if (!adminUser) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Not an admin user" 
      });
    }

    if (!adminUser.isActive) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: "Admin account is inactive" 
      });
    }

    return NextResponse.json({ 
      hasAccess: true,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        emirateId: adminUser.emirateId,
      }
    });

  } catch (error) {
    console.error("Error checking admin access:", error);
    return NextResponse.json(
      { hasAccess: false, reason: "Server error" },
      { status: 500 }
    );
  }
}
