import { getRedis } from "@/lib/kv";

const KEYS = {
  cves: "secwatch:brief:read:cves",
  tweets: "secwatch:brief:read:tweets",
} as const;

type BriefSource = keyof typeof KEYS;

export async function getBriefReadIds(source: BriefSource): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const data = await redis.smembers(KEYS[source]);
    // Upstash peut retourner des numbers pour les IDs numériques (tweet IDs)
    return (data ?? []).map(String);
  } catch {
    return [];
  }
}

export async function markBriefRead(source: BriefSource, id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.sadd(KEYS[source], id);
}

export async function markBriefUnread(source: BriefSource, id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.srem(KEYS[source], id);
}

export async function markManyBriefRead(source: BriefSource, ids: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || ids.length === 0) return;
  await redis.sadd(KEYS[source], ...(ids as [string, ...string[]]));
}
