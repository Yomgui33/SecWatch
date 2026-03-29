import { getRedis } from "@/lib/kv";
import type { RssFeed } from "./types";

const KV_KEY = "secwatch:rss:feeds";
const KV_READ_KEY = "secwatch:rss:read";

// --- Feed CRUD ---

export async function getRssFeeds(): Promise<RssFeed[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const data = await redis.get<RssFeed[]>(KV_KEY);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveRssFeeds(feeds: RssFeed[]): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis non configuré.");
  await redis.set(KV_KEY, feeds);
}

export async function addRssFeed(feed: RssFeed): Promise<void> {
  const feeds = await getRssFeeds();
  if (feeds.some((f) => f.url === feed.url)) return; // déjà présent
  feeds.push(feed);
  await saveRssFeeds(feeds);
}

export async function removeRssFeed(id: string): Promise<void> {
  const feeds = await getRssFeeds();
  await saveRssFeeds(feeds.filter((f) => f.id !== id));
}

// --- Read state ---

export async function getReadIds(): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const data = await redis.smembers(KV_READ_KEY);
    return (data ?? []).map(String);
  } catch {
    return [];
  }
}

export async function markAsRead(articleId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis non configuré.");
  await redis.sadd(KV_READ_KEY, articleId);
}

export async function markAsUnread(articleId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis non configuré.");
  await redis.srem(KV_READ_KEY, articleId);
}

export async function markManyAsRead(articleIds: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || articleIds.length === 0) return;
  await redis.sadd(KV_READ_KEY, ...(articleIds as [string, ...string[]]));
}
