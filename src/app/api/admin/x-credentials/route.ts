import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { verifyCredentials } from "@/lib/sources/twitter/api";
import {
  getXCredentials,
  saveXCredentials,
  deleteXCredentials,
} from "@/lib/sources/twitter/credentials";

// GET — vérifier si des credentials existent et sont valides
export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const creds = await getXCredentials();

  if (!creds) {
    return NextResponse.json({ configured: false });
  }

  const result = await verifyCredentials(creds);
  return NextResponse.json({
    configured: true,
    valid: result.valid,
    screenName: result.screenName ?? creds.screenName ?? null,
  });
}

// POST — sauvegarder de nouveaux credentials
export async function POST(request: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    const { authToken, ct0 } = await request.json();

    if (!authToken || !ct0) {
      return NextResponse.json(
        { error: "auth_token et ct0 sont requis." },
        { status: 400 }
      );
    }

    const clean = {
      authToken: authToken.trim(),
      ct0: ct0.trim(),
      screenName: undefined as string | undefined,
    };

    // Vérifier que les credentials fonctionnent
    const result = await verifyCredentials(clean);
    if (!result.valid) {
      return NextResponse.json(
        { error: "Cookies invalides ou expirés. Vérifiez les valeurs." },
        { status: 401 }
      );
    }

    clean.screenName = result.screenName;

    await saveXCredentials(clean);

    return NextResponse.json({
      success: true,
      screenName: result.screenName,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde." },
      { status: 500 }
    );
  }
}

// DELETE — supprimer les credentials
export async function DELETE() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    await deleteXCredentials();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
