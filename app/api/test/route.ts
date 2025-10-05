// app/api/kv/route.ts
import { redis } from "@/lib/redis";

export async function GET() {
  // write a small JSON value with a 60s TTL
  await redis.set("demo:key", JSON.stringify({ hello: "world" }), "EX", 60);

  // read it back
  const raw = await redis.get("demo:key");
  const data = raw ? JSON.parse(raw) : null;

  return Response.json({ ok: true, data });
}
