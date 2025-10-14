import { NextResponse } from "next/server";
import { Agent } from "undici";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE = "https://onwani.abudhabi.ae/tamm/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const municipality = searchParams.get("municipality");
  const district = searchParams.get("district");

  if (!municipality) {
    return NextResponse.json(
      { error: "Missing required query parameter: municipality" },
      { status: 400 }
    );
  }
  if (!district) {
    return NextResponse.json(
      { error: "Missing required query parameter: district" },
      { status: 400 }
    );
  }

  try {
    const qs = new URLSearchParams({ municipality, DISTRICT_NAME_EN: district });
    const url = `${BASE}/getcommunities?${qs.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const insecure = ["1", "true", "yes"].includes((process.env.ONWANI_INSECURE_TLS || "").toLowerCase());
    const dispatcher = insecure ? new Agent({ connect: { rejectUnauthorized: false } }) : undefined;
    const opts: RequestInit & { dispatcher?: Agent } = {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      ...(dispatcher ? { dispatcher } : {}),
    };
    const res = await fetch(url, opts as RequestInit);
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Upstream error ${res.status}: ${res.statusText || ""}`.trim(), details: text || undefined },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const isAbort = err instanceof Error && (err.name === "AbortError" || message.includes("aborted"));
    return NextResponse.json(
      { error: isAbort ? "Request timed out" : message },
      { status: isAbort ? 504 : 500 }
    );
  }
}
