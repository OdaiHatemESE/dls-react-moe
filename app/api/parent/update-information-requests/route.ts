import { NextResponse } from "next/server";
import prismaParent from "@/lib/prisma-parent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Body = {
  studentPersonId?: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const studentPersonId = body?.studentPersonId?.trim();
    const parentPersonId = body?.parentPersonId?.trim() || null;
    const studentEmirateId = body?.studentEmirateId?.trim() || null;

    if (!studentPersonId) {
      return NextResponse.json({ ok: false, error: "studentPersonId is required" }, { status: 400 });
    }

    // Check if a row already exists for this studentPersonId
    const existing = await prismaParent.updateInformationRequests.findFirst({
      where: { studentPersonId },
    });

    if (existing) {
      return NextResponse.json({ ok: true, alreadyExists: true, data: existing }, { status: 200 });
    }

    // Create a new row (return only safe fields to avoid potential type mapping issues)
    const now = new Date();
    const created = await prismaParent.updateInformationRequests.create({
      data: {
        studentPersonId,
        parentPersonId,
        studentEmirateId,
        // Defaults for flags and statuses are handled by the DB defaults/schema
        createAt: now,
        updateAt: now,
      },
      select: {
        Id: true,
        studentPersonId: true,
        parentPersonId: true,
        isInfoUpdateRequested: true,
        infoUpdateRequestStatus: true,
        isConductAgreementSigned: true,
        conductAgreementStatus: true,
        studentEmirateId: true,
        createAt: true,
        updateAt: true,
      },
    });

    return NextResponse.json({ ok: true, created: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentPersonId = searchParams.get("studentPersonId")?.trim();
    const parentPersonId = searchParams.get("parentPersonId")?.trim() || null;
    const studentEmirateId = searchParams.get("studentEmirateId")?.trim() || null;

    if (!studentPersonId) {
      return NextResponse.json({ ok: false, error: "studentPersonId is required" }, { status: 400 });
    }

    // Read-only behavior to avoid type conversion errors during upsert
    // Try to find an existing record and only return safe fields
    const existing = await prismaParent.updateInformationRequests.findFirst({
      where: { studentPersonId },
      select: {
        Id: true,
        studentPersonId: true,
        parentPersonId: true,
        isInfoUpdateRequested: true,
        infoUpdateRequestStatus: true,
        isConductAgreementSigned: true,
        conductAgreementStatus: true,
        studentEmirateId: true,
        createAt: true,
        updateAt: true,
      },
    });

    // If we found a row and caller passed identifiers, attempt a minimal update without touching status fields
    if (existing && (parentPersonId || studentEmirateId)) {
      const now = new Date();
      const updated = await prismaParent.updateInformationRequests.update({
        where: { studentPersonId },
        data: {
          updateAt: now,
          ...(parentPersonId ? { parentPersonId } : {}),
          ...(studentEmirateId ? { studentEmirateId } : {}),
        },
        select: {
          Id: true,
          studentPersonId: true,
          parentPersonId: true,
          isInfoUpdateRequested: true,
          infoUpdateRequestStatus: true,
          isConductAgreementSigned: true,
          conductAgreementStatus: true,
          studentEmirateId: true,
          createAt: true,
          updateAt: true,
        },
      });
      return NextResponse.json({ ok: true, data: updated });
    }

    if (existing) {
      return NextResponse.json({ ok: true, data: existing });
    }

    // No existing row: return a synthesized default payload (do not create here)
    const now = new Date();
    const synthetic = {
      Id: 0,
      studentPersonId,
      parentPersonId,
      isInfoUpdateRequested: false,
      infoUpdateRequestStatus: null,
      isConductAgreementSigned: false,
      conductAgreementStatus: null,
      studentEmirateId,
      createAt: now,
      updateAt: now,
    } as const;

    return NextResponse.json({ ok: true, data: synthetic });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
