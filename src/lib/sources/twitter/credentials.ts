import { getRedis } from "@/lib/kv";
import type { XCredentials } from "./api";

const KV_KEY = "secwatch:x_credentials";

export async function getXCredentials(): Promise<XCredentials | null> {
  // 1. Essayer Redis (prioritaire — mis à jour via la page admin)
  const redis = getRedis();
  if (redis) {
    try {
      const stored = await redis.get<XCredentials>(KV_KEY);
      if (stored?.authToken && stored?.ct0) return stored;
    } catch {
      // Redis non disponible, fallback .env
    }
  }

  // 2. Fallback sur les variables d'environnement
  const authToken = process.env.X_AUTH_TOKEN;
  const ct0 = process.env.X_CT0;
  const screenName = process.env.X_SCREEN_NAME;
  if (authToken && ct0) return { authToken, ct0, screenName };

  return null;
}

export async function saveXCredentials(creds: XCredentials): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis non configuré.");
  await redis.set(KV_KEY, creds);
}

export async function deleteXCredentials(): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis non configuré.");
  await redis.del(KV_KEY);
}
