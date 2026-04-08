import { NextRequest, NextResponse } from "next/server";
import {
  applySessionCookie,
  ensureApiAuthenticated,
  isDefaultPasswordActive,
  login,
  updatePassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    usesDefaultPassword: await isDefaultPasswordActive(),
  });
}

export async function POST(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    await updatePassword(currentPassword, newPassword);

    const nextSession = await login(newPassword, true);
    const response = NextResponse.json({ success: true });
    if (nextSession) {
      applySessionCookie(response, nextSession.token, nextSession.maxAge);
    }
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "current_password_invalid") {
        return NextResponse.json(
          { error: "Le mot de passe actuel est incorrect." },
          { status: 400 }
        );
      }

      if (error.message === "password_too_short") {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 500 }
    );
  }
}
