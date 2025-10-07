import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Simple connectivity check against SQL Server
    const result = await prisma.$queryRaw<{ value: number }[]>`SELECT 1 AS value`;
    return Response.json({ ok: true, db: result?.[0]?.value === 1 });
  } catch (error: unknown) {
    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
    return Response.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
