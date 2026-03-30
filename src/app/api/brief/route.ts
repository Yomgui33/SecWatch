import { NextResponse } from "next/server";
import { fetchCves, getDateRange } from "@/lib/sources/nvd/api";
import { fetchAllArticles } from "@/lib/sources/rss/api";
import { getRssFeeds, getReadIds, saveRssFeeds } from "@/lib/sources/rss/feeds";
import { DEFAULT_FEEDS } from "@/lib/sources/rss/seed";
import { fetchHomeTimeline } from "@/lib/sources/twitter/api";
import { getXCredentials } from "@/lib/sources/twitter/credentials";
import { getBriefReadIds } from "@/lib/sources/brief/read";
import { getSettings, type BriefSeverity } from "@/lib/settings";

export const dynamic = "force-dynamic";

const SEVERITY_ORDER: Record<BriefSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function GET() {
  const range = getDateRange("24h");
  const h24Ago = new Date(range.start).getTime();
  const settings = await getSettings();

  // Fetch all sources + read states in parallel (skip disabled sources)
  const [cvesResult, rssResult, tweetsResult, cveReadResult, tweetReadResult] = await Promise.allSettled([
    // CVEs
    settings.briefShowCves
      ? fetchCves({
          pubStartDate: range.start,
          pubEndDate: range.end,
          resultsPerPage: 100,
        })
      : Promise.resolve({ cves: [], totalResults: 0 }),

    // Articles RSS
    settings.briefShowRss
      ? (async () => {
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
        })()
      : Promise.resolve({ articles: [], readIds: [] as string[] }),

    // Tweets
    settings.briefShowTweets
      ? (async () => {
          const creds = await getXCredentials();
          if (!creds) return { tweets: [], error: "credentials_missing" as const };
          try {
            const tweets = await fetchHomeTimeline(creds);
            return { tweets, error: null };
          } catch {
            return { tweets: [], error: "fetch_failed" as const };
          }
        })()
      : Promise.resolve({ tweets: [], error: null }),

    // Read states
    getBriefReadIds("cves"),
    getBriefReadIds("tweets"),
  ]);

  // CVEs — filter by configured minimum severity
  const minOrder = SEVERITY_ORDER[settings.briefMinSeverity];
  const cves =
    cvesResult.status === "fulfilled"
      ? cvesResult.value.cves.filter(
          (c) => SEVERITY_ORDER[c.severity as BriefSeverity] !== undefined &&
                 SEVERITY_ORDER[c.severity as BriefSeverity] <= minOrder
        )
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

  const cveReadIds = cveReadResult.status === "fulfilled" ? cveReadResult.value : [];
  const tweetReadIds = tweetReadResult.status === "fulfilled" ? tweetReadResult.value : [];

  return NextResponse.json({
    cves,
    rssArticles,
    rssReadIds: readIds,
    tweets,
    twitterError: tweetsData.error,
    cveReadIds,
    tweetReadIds,
    settings: {
      briefShowCves: settings.briefShowCves,
      briefShowRss: settings.briefShowRss,
      briefShowTweets: settings.briefShowTweets,
      briefMinSeverity: settings.briefMinSeverity,
    },
  });
}
