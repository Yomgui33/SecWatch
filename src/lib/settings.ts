import { getRedis } from "@/lib/kv";

const KV_KEY = "secwatch:settings";

export interface AppSettings {
  autoMarkReadOnClick: boolean;
}

const DEFAULTS: AppSettings = {
  autoMarkReadOnClick: true,
};

export async function getSettings(): Promise<AppSettings> {
  const redis = getRedis();
  if (!redis) return DEFAULTS;
  try {
    const data = await redis.get<AppSettings>(KV_KEY);
    return { ...DEFAULTS, ...data };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis non configuré.");
  const current = await getSettings();
  const merged = { ...current, ...settings };
  await redis.set(KV_KEY, merged);
  return merged;
}
