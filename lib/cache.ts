// lib/cache.ts
import { redis } from "./redis";

type CacheOpts = { ttlSeconds?: number };

export async function cacheGetJSON<T = unknown>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheSetJSON<T = unknown>(
  key: string,
  value: T,
  opts: CacheOpts = { ttlSeconds: 300 } // default 5 minutes
) {
  const ttl = opts.ttlSeconds ?? 300;
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}

export function makeKey(parts: Array<string | number>) {
  // why: stable, namespaced keys like "or:cache:tenantA:classes?page=1"
  return parts.map(String).join(":");
}
