import { NextResponse } from "next/server";
import prismaParent from "@/lib/prisma-parent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { metricsTracker } from '@/lib/metrics-tracker';

export const dynamic = "force-dynamic";

type Body = {
  studentPersonId?: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  // Optional for PATCH updates
  isConductAgreementSigned?: boolean;
  conductAgreementStatus?: number | null;
  pdfBase64?: string | null;
  citizenship?: string | null;
  // Chunked upload support
  chunk?: string | null;
  chunkIndex?: number | null;
  totalChunks?: number | null;
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const endpoint = '/api/parent/update-information-requests';
  
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
      select: {
        Id: true,
        studentPersonId: true,
        parentPersonId: true,
        isInfoUpdateRequested: true,
        infoUpdateRequestStatus: true,
        isConductAgreementSigned: true,
        conductAgreementStatus: true,
        studentEmirateId: true,
        pdfBase64: true,
        citizenship: true,
        createAt: true,
        updateAt: true,
      },
    });

    if (existing) {
      metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
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
        pdfBase64: true,
        citizenship: true,
        createAt: true,
        updateAt: true,
      },
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({ ok: true, created: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const startTime = Date.now();
  const endpoint = '/api/parent/update-information-requests';
  
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
        pdfBase64: true,
        citizenship: true,
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
          pdfBase64: true,
          citizenship: true,
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
      pdfBase64: null,
      citizenship: null,
      createAt: now,
      updateAt: now,
    } as const;

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({ ok: true, data: synthetic });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const startTime = Date.now();
  const endpoint = '/api/parent/update-information-requests';
  
  try {
    const body = (await req.json()) as Body;
    const studentPersonId = body?.studentPersonId?.trim();
    if (!studentPersonId) {
      return NextResponse.json({ ok: false, error: "studentPersonId is required" }, { status: 400 });
    }

    const now = new Date();
    const useChunks = typeof body.chunk === "string" && typeof body.chunkIndex === "number" && typeof body.totalChunks === "number";

    if (useChunks) {
      const chunk = body.chunk as string;
      const chunkIndex = body.chunkIndex as number;
      // If first chunk, create or reset record with initial chunk
      if (chunkIndex === 0) {
        // Try update first, fallback to create if not found
        let updated;
        try {
          updated = await prismaParent.updateInformationRequests.update({
            where: { studentPersonId },
            data: {
              updateAt: now,
              isConductAgreementSigned: true,
              conductAgreementStatus: 1,
              pdfBase64: chunk,
              ...(typeof body.citizenship === "string" ? { citizenship: body.citizenship } : {}),
              ...(typeof body.parentPersonId === "string" ? { parentPersonId: body.parentPersonId } : {}),
              ...(typeof body.studentEmirateId === "string" ? { studentEmirateId: body.studentEmirateId } : {}),
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
              pdfBase64: true,
              citizenship: true,
              createAt: true,
              updateAt: true,
            },
          });
        } catch (e) {
          // If update failed (likely not found), create
          updated = await prismaParent.updateInformationRequests.create({
            data: {
              studentPersonId,
              parentPersonId: body?.parentPersonId ?? null,
              studentEmirateId: body?.studentEmirateId ?? null,
              isConductAgreementSigned: true,
              conductAgreementStatus: 1,
              pdfBase64: chunk,
              citizenship: body?.citizenship ?? null,
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
              pdfBase64: true,
              citizenship: true,
              createAt: true,
              updateAt: true,
            },
          });
        }
        return NextResponse.json({ ok: true, data: updated, chunkAccepted: true }, { status: 200 });
      }

      // For subsequent chunks: read current, append, and save
      const current = await prismaParent.updateInformationRequests.findFirst({
        where: { studentPersonId },
        select: { pdfBase64: true },
      });
      const newPdfBase64 = `${current?.pdfBase64 ?? ""}${chunk}`;
      const updated = await prismaParent.updateInformationRequests.update({
        where: { studentPersonId },
        data: { pdfBase64: newPdfBase64, updateAt: now },
        select: {
          Id: true,
          studentPersonId: true,
          parentPersonId: true,
          isInfoUpdateRequested: true,
          infoUpdateRequestStatus: true,
          isConductAgreementSigned: true,
          conductAgreementStatus: true,
          studentEmirateId: true,
          pdfBase64: true,
          citizenship: true,
          createAt: true,
          updateAt: true,
        },
      });
      return NextResponse.json({ ok: true, data: updated, chunkAccepted: true }, { status: 200 });
    }

    // Replace upsert with update-then-create fallback to avoid runtime upsert issues
    let updated;
    try {
      updated = await prismaParent.updateInformationRequests.update({
        where: { studentPersonId },
        data: {
          updateAt: now,
          ...(typeof body.isConductAgreementSigned === "boolean"
            ? { isConductAgreementSigned: body.isConductAgreementSigned }
            : {}),
          ...(typeof body.conductAgreementStatus === "number"
            ? { conductAgreementStatus: body.conductAgreementStatus }
            : {}),
          ...(typeof body.pdfBase64 === "string" ? { pdfBase64: body.pdfBase64 } : {}),
          ...(typeof body.citizenship === "string" ? { citizenship: body.citizenship } : {}),
          ...(typeof body.parentPersonId === "string" ? { parentPersonId: body.parentPersonId } : {}),
          ...(typeof body.studentEmirateId === "string" ? { studentEmirateId: body.studentEmirateId } : {}),
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
          pdfBase64: true,
          citizenship: true,
          createAt: true,
          updateAt: true,
        },
      });
    } catch (e) {
      // If update failed (likely not found), create a new record
      updated = await prismaParent.updateInformationRequests.create({
        data: {
          studentPersonId,
          parentPersonId: body?.parentPersonId ?? null,
          studentEmirateId: body?.studentEmirateId ?? null,
          isConductAgreementSigned: body?.isConductAgreementSigned ?? true,
          conductAgreementStatus: body?.conductAgreementStatus ?? 1,
          pdfBase64: body?.pdfBase64 ?? null,
          citizenship: body?.citizenship ?? null,
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
          pdfBase64: true,
          citizenship: true,
          createAt: true,
          updateAt: true,
        },
      });
    }

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
