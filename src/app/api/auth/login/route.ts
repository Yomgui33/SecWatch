import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie, login } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = typeof body.password === "string" ? body.password : "";
    const remember = Boolean(body.remember);

    if (!password) {
      return NextResponse.json({ error: "Le mot de passe est requis." }, { status: 400 });
    }

    const session = await login(password, remember);
    if (!session) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    applySessionCookie(response, session.token, session.maxAge);
    return response;
  } catch {
    return NextResponse.json({ error: "Connexion impossible." }, { status: 500 });
  }
}
