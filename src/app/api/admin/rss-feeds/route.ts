import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated, getPublicError } from "@/lib/auth";
import { getRssFeeds, addRssFeed, removeRssFeed, saveRssFeeds } from "@/lib/sources/rss/feeds";
import { feedIdFromUrl } from "@/lib/sources/rss/types";
import { DEFAULT_FEEDS } from "@/lib/sources/rss/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const feeds = await getRssFeeds();
  return NextResponse.json({ feeds });
}

export async function POST(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();

    // Seed des flux par défaut
    if (body.seed) {
      await saveRssFeeds(DEFAULT_FEEDS);
      return NextResponse.json({ feeds: DEFAULT_FEEDS });
    }

    const { name, url } = body as { name: string; url: string };
    if (!name || !url) {
      return NextResponse.json({ error: "Nom et URL requis." }, { status: 400 });
    }

    const feed = { id: feedIdFromUrl(url), name, url, htmlUrl: body.htmlUrl };
    await addRssFeed(feed);
    const feeds = await getRssFeeds();
    return NextResponse.json({ feeds });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id manquant" }, { status: 400 });
    }
    await removeRssFeed(id);
    const feeds = await getRssFeeds();
    return NextResponse.json({ feeds });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
