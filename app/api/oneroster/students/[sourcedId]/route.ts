import { NextResponse } from "next/server";
import { orFetch } from "@/lib/oneroster";
import { cacheGetJSON, cacheSetJSON, makeKey } from "@/lib/cache";

// Ensure this route is always dynamic (no ISR)
export const dynamic = "force-dynamic";

// Basic TTL for student lookups (10 minutes)
const TTL_SECONDS = 10 * 60;

type RouteParams = { params: { sourcedId: string } };

export async function GET(req: Request, ctx: RouteParams) {
  const { sourcedId } = ctx.params || {};
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const noCache = ["1", "true", "yes"].includes((searchParams.get("nocache") || "").toLowerCase());

  if (!sourcedId || typeof sourcedId !== "string" || sourcedId.trim().length === 0) {
    return NextResponse.json({ error: "Missing or invalid sourcedId" }, { status: 400 });
  }

  // Forward all query params except nocache to the vendor
  const passthrough = new URLSearchParams();
  for (const [k, v] of searchParams.entries()) {
    if (k.toLowerCase() === "nocache") continue;
    passthrough.set(k, v);
  }
  const query = passthrough.toString();

  const key = makeKey(["or", "students", sourcedId, query || "none"]);

  // Try cache first unless bypassed
  if (!noCache) {
    const cached = await cacheGetJSON<unknown>(key);
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  try {
    // Call vendor endpoint directly, keep response shape vendor-native
    const path = `/v1p1/students/${encodeURIComponent(sourcedId)}${query ? `?${query}` : ""}`;
    const data = await orFetch<unknown>(path, "read");

    // Cache the payload (best-effort)
    await cacheSetJSON(key, data, { ttlSeconds: TTL_SECONDS });

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
