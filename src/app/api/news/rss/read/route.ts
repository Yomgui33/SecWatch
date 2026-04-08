import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { getReadIds, markAsRead, markAsUnread, markManyAsRead } from "@/lib/sources/rss/feeds";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const readIds = await getReadIds();
  return NextResponse.json({ readIds });
}

export async function POST(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const body = await req.json();

  // Marquer plusieurs articles comme lus
  if (Array.isArray(body.ids)) {
    await markManyAsRead(body.ids);
    return NextResponse.json({ ok: true });
  }

  // Marquer un seul article
  const { id, read } = body as { id: string; read: boolean };
  if (!id) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  if (read) {
    await markAsRead(id);
  } else {
    await markAsUnread(id);
  }

  return NextResponse.json({ ok: true });
}
