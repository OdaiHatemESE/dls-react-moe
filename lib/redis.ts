    // lib/redis.ts
import Redis from "ioredis";

export const redis = new Redis({
  host: "127.0.0.1",       // WSL Redis listens on localhost
  port: 6379,              // default Redis port
  // password: "StrongPass123!", // uncomment if you set requirepass in redis.conf
  maxRetriesPerRequest: 1, // fail fast if Redis is unreachable
});
