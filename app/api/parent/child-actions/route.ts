import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getChildActionsSummary } from "@/lib/child-actions";
import type { ChildActionResponse } from "@/types/child-actions";
import type { IDHStudent } from "@/app/types/idh";

export const dynamic = "force-dynamic";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentPersonId = searchParams.get("studentPersonId")?.trim();
    const parentPersonId = searchParams.get("parentPersonId")?.trim() || null;
    const studentEmirateId = searchParams.get("studentEmirateId")?.trim() || null;
    const includeIdh = TRUE_VALUES.has((searchParams.get("includeIdh") ?? "").toLowerCase());

    if (!studentPersonId) {
      return NextResponse.json({ ok: false, error: "studentPersonId is required" }, { status: 400 });
    }

    let idhStatusId: number | null = null;
    let idhFetchedAt: string | null = null;

    if (includeIdh) {
      const idh = await fetchIdhStatus(studentPersonId, req);
      idhStatusId = idh.statusId;
      idhFetchedAt = idh.fetchedAt;
    }

    const payload = await getChildActionsSummary({
      studentPersonId,
      parentPersonId,
      studentEmirateId,
      idhStatusId,
      idhFetchedAt,
    });

    return NextResponse.json(payload as ChildActionResponse);
  } catch (error) {
    console.error("child-actions GET failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

async function fetchIdhStatus(studentPersonId: string, req: Request): Promise<{ statusId: number | null; fetchedAt: string | null }> {
  try {
    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      console.warn("PP_BASE_URL missing; skipping IDH fetch");
      return { statusId: null, fetchedAt: null };
    }

    const origin = new URL(req.url).origin;
    const tokenRes = await fetch(`${origin}/api/PP/auth/token`, { cache: "no-store" });
    if (!tokenRes.ok) {
      console.warn("Failed to retrieve PP token", await tokenRes.text());
      return { statusId: null, fetchedAt: null };
    }

    const tokenJson = (await tokenRes.json()) as { accessToken?: string };
    const accessToken = tokenJson.accessToken;
    if (!accessToken) {
      console.warn("PP token response missing accessToken");
      return { statusId: null, fetchedAt: null };
    }

    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh?sourceId=${encodeURIComponent(studentPersonId)}`;
    const idhRes = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (idhRes.status === 404) {
      return { statusId: null, fetchedAt: new Date().toISOString() };
    }

    if (!idhRes.ok) {
      console.warn("IDH fetch failed", idhRes.status, await idhRes.text());
      return { statusId: null, fetchedAt: null };
    }

    const idhData = (await idhRes.json().catch(() => null)) as IDHStudent | null;
    const statusId = typeof idhData?.statusId === "number" ? idhData.statusId : null;
    return { statusId, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.warn("Error while fetching IDH status", error);
    return { statusId: null, fetchedAt: null };
  }
}
