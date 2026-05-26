import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_FILE = join(process.cwd(), ".secwatch-config.json");
const ENV_FILE = join(process.cwd(), ".env.local");

export interface RuntimeConfig {
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  NVD_API_KEY?: string;
  VULNCHECK_API_TOKEN?: string;
  SECWATCH_PASSWORD_HASH?: string;
}

export function isManagedHosting(): boolean {
  return process.env.VERCEL === "1";
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Read runtime config from .secwatch-config.json (falls back to env vars) */
export function getRuntimeConfig(): RuntimeConfig {
  const config: RuntimeConfig = {};

  // Read from JSON file first
  if (existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
      if (data.KV_REST_API_URL) config.KV_REST_API_URL = data.KV_REST_API_URL;
      if (data.KV_REST_API_TOKEN) config.KV_REST_API_TOKEN = data.KV_REST_API_TOKEN;
      if (data.NVD_API_KEY) config.NVD_API_KEY = data.NVD_API_KEY;
      if (data.SECWATCH_PASSWORD_HASH) config.SECWATCH_PASSWORD_HASH = data.SECWATCH_PASSWORD_HASH;
    } catch {
      // ignore parse errors
    }
  }

  // Fall back to env vars, including Vercel/Upstash native names.
  if (!config.KV_REST_API_URL) {
    config.KV_REST_API_URL =
      readEnv("KV_REST_API_URL") ?? readEnv("UPSTASH_REDIS_REST_URL");
  }
  if (!config.KV_REST_API_TOKEN) {
    config.KV_REST_API_TOKEN =
      readEnv("KV_REST_API_TOKEN") ?? readEnv("UPSTASH_REDIS_REST_TOKEN");
  }
  if (!config.NVD_API_KEY) config.NVD_API_KEY = readEnv("NVD_API_KEY");
  if (!config.VULNCHECK_API_TOKEN) config.VULNCHECK_API_TOKEN = readEnv("VULNCHECK_API_TOKEN");
  if (!config.SECWATCH_PASSWORD_HASH) {
    config.SECWATCH_PASSWORD_HASH = readEnv("SECWATCH_PASSWORD_HASH");
  }

  return config;
}

/** Save runtime config to .secwatch-config.json and .env.local */
export function saveRuntimeConfig(update: Partial<RuntimeConfig>): RuntimeConfig {
  if (isManagedHosting()) {
    throw new Error(
      "Cette instance est hébergée sur Vercel. Configurez les variables d'environnement dans le dashboard Vercel."
    );
  }

  // Merge with existing config
  const current = getRuntimeConfig();
  const merged: RuntimeConfig = { ...current, ...update };

  // Write JSON config (read at runtime without restart)
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");

  // Write .env.local for persistence across restarts
  writeEnvLocal(merged);

  return merged;
}

/** Write/update .env.local file */
function writeEnvLocal(config: RuntimeConfig) {
  const entries: Record<string, string> = {};

  // Read existing .env.local to preserve unknown keys
  if (existsSync(ENV_FILE)) {
    try {
      const content = readFileSync(ENV_FILE, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          entries[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
        }
      }
    } catch {
      // ignore
    }
  }

  // Update with new values
  if (config.KV_REST_API_URL) entries.KV_REST_API_URL = config.KV_REST_API_URL;
  if (config.KV_REST_API_TOKEN) entries.KV_REST_API_TOKEN = config.KV_REST_API_TOKEN;
  if (config.NVD_API_KEY !== undefined) entries.NVD_API_KEY = config.NVD_API_KEY ?? "";
  if (config.VULNCHECK_API_TOKEN !== undefined) entries.VULNCHECK_API_TOKEN = config.VULNCHECK_API_TOKEN ?? "";
  if (config.SECWATCH_PASSWORD_HASH !== undefined) {
    entries.SECWATCH_PASSWORD_HASH = config.SECWATCH_PASSWORD_HASH ?? "";
  }

  const lines = Object.entries(entries).map(([k, v]) => `${k}=${v}`);
  writeFileSync(ENV_FILE, lines.join("\n") + "\n", "utf-8");
}
