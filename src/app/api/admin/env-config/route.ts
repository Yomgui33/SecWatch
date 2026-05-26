import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { ensureApiAuthenticated } from "@/lib/auth";
import { getRuntimeConfig, isManagedHosting, saveRuntimeConfig } from "@/lib/config";
import { resetRedis } from "@/lib/kv";

export const dynamic = "force-dynamic";

// GET — return current config status (masked values)
export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const config = getRuntimeConfig();
  const managedHosting = isManagedHosting();
  return NextResponse.json({
    redisConfigured: !!(config.KV_REST_API_URL && config.KV_REST_API_TOKEN),
    redisUrl: config.KV_REST_API_URL ? maskValue(config.KV_REST_API_URL) : "",
    vulncheckConfigured: !!config.VULNCHECK_API_TOKEN,
    managedHosting,
    configMode: managedHosting ? "vercel-env" : "local-runtime",
  });
}

// POST — save new config values and test connection
export async function POST(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { kvUrl, kvToken, vulncheckToken } = body as {
      kvUrl?: string;
      kvToken?: string;
      vulncheckToken?: string;
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

      try {
        saveRuntimeConfig({
          KV_REST_API_URL: testUrl,
          KV_REST_API_TOKEN: testToken,
          ...(vulncheckToken !== undefined ? { VULNCHECK_API_TOKEN: vulncheckToken.trim() } : {}),
        });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Configuration impossible." },
          { status: 400 }
        );
      }

      // Reset singleton so next call uses new credentials
      resetRedis();
    } else if (vulncheckToken !== undefined) {
      // Only updating VulnCheck token
      try {
        saveRuntimeConfig({ VULNCHECK_API_TOKEN: vulncheckToken.trim() });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Configuration impossible." },
          { status: 400 }
        );
      }
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
