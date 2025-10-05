// lib/cache.ts
import { redis } from "./redis";

type CacheOpts = { ttlSeconds?: number };

// In-memory fallback store when Redis is unavailable
type MemEntry = { exp: number; json: string };
const mem = new Map<string, MemEntry>();
const nowSec = () => Math.floor(Date.now() / 1000);

function memGet<T>(key: string): T | null {
  const hit = mem.get(key);
  if (!hit) return null;
  if (hit.exp <= nowSec()) {
    mem.delete(key);
    return null;
  }
  try {
    return JSON.parse(hit.json) as T;
  } catch {
    // Corrupted JSON, drop it
    mem.delete(key);
    return null;
  }
}

function memSet<T>(key: string, value: T, ttlSeconds: number) {
  const exp = nowSec() + (ttlSeconds > 0 ? ttlSeconds : 300);
  try {
    const json = JSON.stringify(value);
    mem.set(key, { exp, json });
  } catch {
    // Non-serializable value; ignore for mem cache
  }
}

export async function cacheGetJSON<T = unknown>(key: string): Promise<T | null> {
  // Try Redis first
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      // Bad JSON in Redis; delete and fall back
      try { await redis.del(key); } catch {}
      return null;
    }
  } catch (err) {
    // Redis unavailable: fall back to in-memory
    return memGet<T>(key);
  }
}

export async function cacheSetJSON<T = unknown>(
  key: string,
  value: T,
  opts: CacheOpts = { ttlSeconds: 300 } // default 5 minutes
) {
  const ttl = opts.ttlSeconds ?? 300;
  // Attempt Redis set; on failure, use memory fallback
  try {
    const json = JSON.stringify(value);
    await redis.set(key, json, "EX", ttl);
  } catch {
    memSet(key, value, ttl);
  }
}

export function makeKey(parts: Array<string | number>) {
  // why: stable, namespaced keys like "or:cache:tenantA:classes?page=1"
  return parts.map(String).join(":");
}
