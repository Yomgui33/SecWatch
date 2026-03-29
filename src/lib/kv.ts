import { Redis } from "@upstash/redis";
import { getRuntimeConfig } from "@/lib/config";

let redis: Redis | null = null;
let lastUrl: string | undefined;

export function getRedis(): Redis | null {
  const config = getRuntimeConfig();
  const url = config.KV_REST_API_URL;
  const token = config.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  // Reconnect if URL changed (new config saved at runtime)
  if (redis && lastUrl === url) return redis;

  redis = new Redis({ url, token });
  lastUrl = url;
  return redis;
}

/** Reset Redis singleton (used after saving new config) */
export function resetRedis(): void {
  redis = null;
  lastUrl = undefined;
}
