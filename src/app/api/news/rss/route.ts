import { NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { getRssFeeds } from "@/lib/sources/rss/feeds";
import { fetchAllArticles } from "@/lib/sources/rss/api";
import { DEFAULT_FEEDS } from "@/lib/sources/rss/seed";
import { saveRssFeeds } from "@/lib/sources/rss/feeds";

export const revalidate = 1800; // 30 minutes

export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    let feeds = await getRssFeeds();

    // Auto-seed si aucun flux configuré
    if (feeds.length === 0) {
      feeds = DEFAULT_FEEDS;
      try {
        await saveRssFeeds(feeds);
      } catch {
        // Redis indisponible — on fetch quand même les flux par défaut
      }
    }

    const articles = await fetchAllArticles(feeds);
    return NextResponse.json({ articles, total: articles.length });
  } catch {
    return NextResponse.json(
      { error: "fetch_failed", message: "Impossible de récupérer les flux RSS.", articles: [], total: 0 },
      { status: 502 }
    );
  }
}
