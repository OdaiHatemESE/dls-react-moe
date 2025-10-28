import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalPrisma } from "@prisma/client-parent-portal";

const prisma = new ParentPortalPrisma();

// GET all admin users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }
}

// POST create new admin user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emirateId, name, email, isActive } = body;

    if (!emirateId || !name) {
      return NextResponse.json(
        { error: "Emirates ID and name are required" },
        { status: 400 }
      );
    }

    // Normalize Emirates ID (remove dashes and spaces)
    const normalizedEid = emirateId.replace(/[-\s]/g, "");

    const user = await prisma.adminUser.create({
      data: {
        emirateId: normalizedEid,
        name,
        email: email || null,
        isActive: isActive ?? true,
        createdBy: session.user.emiratesId || session.user.id || "system",
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Admin user with this Emirates ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}

// DELETE admin user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await prisma.adminUser.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json(
      { error: "Failed to delete admin user" },
      { status: 500 }
    );
  }
}

// PATCH update admin user
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Normalize Emirates ID if being updated
    if (updates.emirateId) {
      updates.emirateId = updates.emirateId.replace(/[-\s]/g, "");
    }

    const user = await prisma.adminUser.update({
      where: { id: parseInt(id) },
      data: updates,
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error updating admin user:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Admin user with this Emirates ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update admin user" },
      { status: 500 }
    );
  }
}
