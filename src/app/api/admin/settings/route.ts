import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const settings = await saveSettings(body);
  return NextResponse.json(settings);
}
