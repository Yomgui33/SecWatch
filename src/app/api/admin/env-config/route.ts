import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getRuntimeConfig, saveRuntimeConfig } from "@/lib/config";
import { resetRedis } from "@/lib/kv";

export const dynamic = "force-dynamic";

// GET — return current config status (masked values)
export async function GET() {
  const config = getRuntimeConfig();
  return NextResponse.json({
    redisConfigured: !!(config.KV_REST_API_URL && config.KV_REST_API_TOKEN),
    redisUrl: config.KV_REST_API_URL ? maskValue(config.KV_REST_API_URL) : "",
    nvdConfigured: !!config.NVD_API_KEY,
  });
}

// POST — save new config values and test connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kvUrl, kvToken, nvdApiKey } = body as {
      kvUrl?: string;
      kvToken?: string;
      nvdApiKey?: string;
    };

    // If Redis credentials provided, test them first
    if (kvUrl && kvToken) {
      const testUrl = kvUrl.trim();
      const testToken = kvToken.trim();

      try {
        const testRedis = new Redis({ url: testUrl, token: testToken });
        await testRedis.ping();
      } catch {
        return NextResponse.json(
          { error: "Connexion Redis échouée. Vérifiez l'URL et le token." },
          { status: 400 }
        );
      }

      saveRuntimeConfig({
        KV_REST_API_URL: testUrl,
        KV_REST_API_TOKEN: testToken,
        ...(nvdApiKey !== undefined ? { NVD_API_KEY: nvdApiKey.trim() } : {}),
      });

      // Reset singleton so next call uses new credentials
      resetRedis();
    } else if (nvdApiKey !== undefined) {
      // Only updating NVD key
      saveRuntimeConfig({ NVD_API_KEY: nvdApiKey.trim() });
    } else {
      return NextResponse.json(
        { error: "Aucune donnée à sauvegarder." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: `Erreur: ${e instanceof Error ? e.message : "inconnue"}` },
      { status: 500 }
    );
  }
}

function maskValue(value: string): string {
  if (value.length <= 12) return "••••••••";
  return value.slice(0, 8) + "••••" + value.slice(-4);
}
