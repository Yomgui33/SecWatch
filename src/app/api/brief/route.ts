import { NextResponse } from "next/server";
import { fetchCves, getDateRange } from "@/lib/sources/nvd/api";
import { fetchAllArticles } from "@/lib/sources/rss/api";
import { getRssFeeds, getReadIds, saveRssFeeds } from "@/lib/sources/rss/feeds";
import { DEFAULT_FEEDS } from "@/lib/sources/rss/seed";
import { fetchHomeTimeline } from "@/lib/sources/twitter/api";
import { getXCredentials } from "@/lib/sources/twitter/credentials";

export const dynamic = "force-dynamic";

export async function GET() {
  const range = getDateRange("24h");
  const h24Ago = new Date(range.start).getTime();

  // Fetch all sources in parallel
  const [cvesResult, rssResult, tweetsResult] = await Promise.allSettled([
    // CVEs critiques des dernières 24h
    fetchCves({
      pubStartDate: range.start,
      pubEndDate: range.end,
      resultsPerPage: 100,
    }),

    // Articles RSS
    (async () => {
      let feeds = await getRssFeeds();
      if (feeds.length === 0) {
        feeds = DEFAULT_FEEDS;
        try { await saveRssFeeds(feeds); } catch { /* ignore */ }
      }
      const [articles, readIds] = await Promise.all([
        fetchAllArticles(feeds),
        getReadIds(),
      ]);
      return { articles, readIds };
    })(),

    // Tweets
    (async () => {
      const creds = await getXCredentials();
      if (!creds) return { tweets: [], error: "credentials_missing" as const };
      try {
        const tweets = await fetchHomeTimeline(creds);
        return { tweets, error: null };
      } catch {
        return { tweets: [], error: "fetch_failed" as const };
      }
    })(),
  ]);

  // CVEs — critical only
  const cves =
    cvesResult.status === "fulfilled"
      ? cvesResult.value.cves.filter((c) => c.severity === "CRITICAL")
      : [];

  // RSS — 24h only
  const rssData = rssResult.status === "fulfilled" ? rssResult.value : { articles: [], readIds: [] };
  const rssArticles = rssData.articles.filter(
    (a) => new Date(a.published).getTime() >= h24Ago
  );
  const readIds = rssData.readIds;

  // Tweets — 24h only
  const tweetsData = tweetsResult.status === "fulfilled" ? tweetsResult.value : { tweets: [], error: "fetch_failed" as const };
  const tweets = tweetsData.tweets.filter(
    (t) => new Date(t.published).getTime() >= h24Ago
  );

  return NextResponse.json({
    cves,
    rssArticles,
    readIds,
    tweets,
    twitterError: tweetsData.error,
  });
}
