import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { getPeaksysFeed, getPeaksysUnreadCount } from "@/lib/sources/peaksys/feed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const params = req.nextUrl.searchParams;

  // Pastille de l'onglet : seul le compteur des non lus sur 24 h est renvoyé
  if (params.get("count") === "1") {
    const unread = await getPeaksysUnreadCount();
    return NextResponse.json({ unread });
  }

  const window = params.get("window") === "7d" ? "7d" : "24h";
  const feed = await getPeaksysFeed(window);
  return NextResponse.json({ ...feed, window });
}
