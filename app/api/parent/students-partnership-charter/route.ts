import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type CharterPayload = {
  academicyear?: string;
  studentNumber?: string;
  attachment01?: string;
  datetime?: string;
};

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

type CharterRecord = {
  academicyear?: string;
  studentNumber?: string;
  attachment01?: string | null;
  datetime?: string | null;
};

function buildTokenUrl(req: Request): string {
  return new URL("/api/PP/auth/token", req.url).toString();
}

function normalizeCharter(input: unknown): CharterRecord | null {
  if (!input) return null;

  if (Array.isArray(input)) {
    return input.length ? normalizeCharter(input[0]) : null;
  }

  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (record.data) return normalizeCharter(record.data);
    if (record.Data) return normalizeCharter(record.Data);

    const readString = (keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = record[key];
        if (typeof value === "string" && value.trim().length > 0) {
          return value.trim();
        }
      }
      return undefined;
    };

    const academicyear = readString(["academicyear", "Academicyear", "AcademicYear", "academyYear"]);
    const studentNumber = readString(["studentNumber", "StudentNumber"]);
    const attachment01 = readString(["attachment01", "Attachment01"]);
    const datetime = readString(["datetime", "Datetime", "dateTime"]);

    return {
      academicyear,
      studentNumber,
      attachment01: attachment01 ?? null,
      datetime,
    };
  }

  if (typeof input === "string" && input.trim().length > 0) {
    return {
      attachment01: input.trim(),
    };
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentNumber = searchParams.get("studentNumber")?.trim();
    const academicyear = searchParams.get("academicyear")?.trim() || '2025-2026';

    if (!studentNumber) {
      return NextResponse.json({ ok: false, error: "studentNumber is required" }, { status: 400 });
    }

    const tokenUrl = buildTokenUrl(req);
    const tokenRes = await fetch(tokenUrl);
    const tokenData: PPTokenResponse = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.accessToken) {
      return NextResponse.json(
        { ok: false, error: tokenData.error || "Failed to acquire PP token" },
        { status: 500 },
      );
    }

    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "PP_BASE_URL not configured" }, { status: 500 });
    }

    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh/students-partnership-charter?studentNumber=${encodeURIComponent(studentNumber)}&academicyear=${encodeURIComponent(academicyear)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const rawText = await upstreamRes.text();
    let parsed: unknown = null;
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = rawText;
      }
    }

    console.log('[Charter GET] Status:', upstreamRes.status);
    console.log('[Charter GET] Raw response:', rawText);
    console.log('[Charter GET] Parsed:', JSON.stringify(parsed, null, 2));

    if (upstreamRes.status === 404) {
      return NextResponse.json({
        ok: true,
        data: null,
        meta: {
          studentNumber,
          fetchedAt: new Date().toISOString(),
        },
      });
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: typeof parsed === "string" && parsed.trim().length > 0
            ? parsed
            : `Upstream returned ${upstreamRes.status}`,
          upstream: parsed,
        },
        { status: upstreamRes.status },
      );
    }

    const normalized = normalizeCharter(parsed);
    console.log('[Charter GET] Normalized:', JSON.stringify(normalized, null, 2));

    return NextResponse.json({
      ok: true,
      data: normalized,
      meta: {
        studentNumber,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CharterPayload;
    const academicyear = body?.academicyear?.trim();
    const studentNumber = body?.studentNumber?.trim();
    const attachment01 = body?.attachment01;
    const datetime = body?.datetime?.trim();

    if (!academicyear) {
      return NextResponse.json({ ok: false, error: "academicyear is required" }, { status: 400 });
    }

    if (!studentNumber) {
      return NextResponse.json({ ok: false, error: "studentNumber is required" }, { status: 400 });
    }

    if (!attachment01) {
      return NextResponse.json({ ok: false, error: "attachment01 is required" }, { status: 400 });
    }

    if (!datetime) {
      return NextResponse.json({ ok: false, error: "datetime is required" }, { status: 400 });
    }

    const tokenUrl = buildTokenUrl(req);
    const tokenRes = await fetch(tokenUrl);
    const tokenData: PPTokenResponse = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.accessToken) {
      return NextResponse.json(
        { ok: false, error: tokenData.error || "Failed to acquire PP token" },
        { status: 500 },
      );
    }

    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "PP_BASE_URL not configured" }, { status: 500 });
    }

    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh/students-partnership-charter`;
    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ academicyear, studentNumber, attachment01, datetime }),
    });

    const upstreamJson = await upstreamRes.json().catch(() => null);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { ok: false, error: upstreamJson ?? `Upstream returned ${upstreamRes.status}` },
        { status: upstreamRes.status },
      );
    }

    return NextResponse.json({
      ok: true,
      data: upstreamJson,
      meta: {
        forwardedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
