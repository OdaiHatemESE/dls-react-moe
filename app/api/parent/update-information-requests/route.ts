import { NextResponse } from "next/server";
import prismaParent from "@/lib/prisma-parent";

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

    // Create a new row
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
    });

    return NextResponse.json({ ok: true, created: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
