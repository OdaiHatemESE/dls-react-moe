import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalPrisma } from "@prisma/client-parent-portal";

const prisma = new ParentPortalPrisma();

// GET all student actions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const educationType = searchParams.get("educationType");

    const where = educationType ? { educationType } : {};

    const actions = await prisma.studentActionConfig.findMany({
      where,
      orderBy: [{ educationType: "asc" }, { displayOrder: "asc" }],
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error("Error fetching student actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch student actions" },
      { status: 500 }
    );
  }
}

// POST create new student action
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      educationType,
      actionName,
      actionKey,
      isEnabled,
      displayOrder,
      description,
      configJson,
    } = body;

    if (!educationType || !actionName || !actionKey) {
      return NextResponse.json(
        { error: "Education type, action name, and action key are required" },
        { status: 400 }
      );
    }

    const action = await prisma.studentActionConfig.create({
      data: {
        educationType,
        actionName,
        actionKey,
        isEnabled: isEnabled ?? true,
        displayOrder: displayOrder ?? 0,
        description: description || null,
        configJson: configJson || null,
        createdBy: session.user.emiratesId || session.user.id || "system",
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error: any) {
    console.error("Error creating student action:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Action with this education type and key already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create student action" },
      { status: 500 }
    );
  }
}

// DELETE student action
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
        { error: "Action ID is required" },
        { status: 400 }
      );
    }

    await prisma.studentActionConfig.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Action deleted successfully" });
  } catch (error) {
    console.error("Error deleting student action:", error);
    return NextResponse.json(
      { error: "Failed to delete student action" },
      { status: 500 }
    );
  }
}

// PATCH update student action
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
        { error: "Action ID is required" },
        { status: 400 }
      );
    }

    const action = await prisma.studentActionConfig.update({
      where: { id: parseInt(id) },
      data: updates,
    });

    return NextResponse.json(action);
  } catch (error: any) {
    console.error("Error updating student action:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Action with this education type and key already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update student action" },
      { status: 500 }
    );
  }
}
