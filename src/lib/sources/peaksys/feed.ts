import type { CveEntry } from "@/lib/sources/nvd/types";
import type { RssArticle } from "@/lib/sources/rss/types";
import type { TweetEntry } from "@/lib/sources/twitter/types";
import { fetchCvesPublishedBetween, getPublishedRange } from "@/lib/sources/vulncheck/api";
import { fetchAllArticles } from "@/lib/sources/rss/api";
import { getRssFeeds, getReadIds } from "@/lib/sources/rss/feeds";
import { DEFAULT_FEEDS } from "@/lib/sources/rss/seed";
import { fetchHomeTimeline } from "@/lib/sources/twitter/api";
import { getXCredentials } from "@/lib/sources/twitter/credentials";
import { getBriefReadIds } from "@/lib/sources/brief/read";
import { buildTopicMatcher, productsToText } from "./match";
import { getPeaksysTopics, type PeaksysTopic } from "./topics";

export type PeaksysWindow = "24h" | "7d";

export type WithTopics<T> = T & { topics: string[] };

export interface PeaksysItems {
  cves: WithTopics<CveEntry>[];
  rssArticles: WithTopics<RssArticle>[];
  tweets: WithTopics<TweetEntry>[];
  cveError: boolean;
  twitterError: "credentials_missing" | "fetch_failed" | null;
}

export interface PeaksysReadIds {
  cveReadIds: string[];
  rssReadIds: string[];
  tweetReadIds: string[];
}

/** Le fil d'accueil X n'est pas filtrable par date : on en prend un maximum. */
const TWEET_COUNT = 100;
/** Évite de re-solliciter X et les flux RSS à chaque navigation (pastille + page). */
const CACHE_TTL_MS = 60_000;

let cache: { key: string; at: number; promise: Promise<PeaksysItems> } | null = null;

function tweetText(t: TweetEntry): string {
  return [
    t.content,
    t.quoted?.content,
    t.card?.title,
    t.card?.description,
  ].filter(Boolean).join("\n");
}

function tag<T>(items: T[], toText: (item: T) => string, match: (text: string) => string[]): WithTopics<T>[] {
  const tagged: WithTopics<T>[] = [];
  for (const item of items) {
    const topics = match(toText(item));
    if (topics.length > 0) tagged.push({ ...item, topics });
  }
  return tagged;
}

async function fetchItems(topics: PeaksysTopic[]): Promise<PeaksysItems> {
  // On récupère toujours la fenêtre la plus large (7 jours) : la vue 24 h et la
  // pastille en sont un simple sous-ensemble, sans second appel aux sources.
  const range = getPublishedRange("7d");
  const startMs = Date.parse(range.start);
  const match = buildTopicMatcher(topics);

  const [cvesResult, rssResult, tweetsResult] = await Promise.allSettled([
    fetchCvesPublishedBetween(range),
    (async () => {
      const feeds = await getRssFeeds();
      return fetchAllArticles(feeds.length > 0 ? feeds : DEFAULT_FEEDS);
    })(),
    (async () => {
      const creds = await getXCredentials();
      if (!creds) return { tweets: [], error: "credentials_missing" as const };
      try {
        return { tweets: await fetchHomeTimeline(creds, TWEET_COUNT), error: null };
      } catch {
        return { tweets: [], error: "fetch_failed" as const };
      }
    })(),
  ]);

  const cves = cvesResult.status === "fulfilled" ? cvesResult.value.cves : [];
  const articles = (rssResult.status === "fulfilled" ? rssResult.value : []).filter(
    (a) => new Date(a.published).getTime() >= startMs
  );
  const tweetsData =
    tweetsResult.status === "fulfilled" ? tweetsResult.value : { tweets: [], error: "fetch_failed" as const };
  const tweets = tweetsData.tweets.filter((t) => new Date(t.published).getTime() >= startMs);

  return {
    cves: tag(cves, (c) => `${c.description}\n${productsToText(c.products)}`, match),
    rssArticles: tag(articles, (a) => `${a.title}\n${a.content}`, match),
    tweets: tag(tweets, tweetText, match),
    cveError: cvesResult.status === "rejected",
    twitterError: tweetsData.error,
  };
}

function getItems(topics: PeaksysTopic[]): Promise<PeaksysItems> {
  const key = JSON.stringify(topics);
  if (cache && cache.key === key && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.promise;
  }
  const promise = fetchItems(topics);
  cache = { key, at: Date.now(), promise };
  // Ne pas garder en cache un échec inattendu
  promise.catch(() => {
    if (cache?.promise === promise) cache = null;
  });
  return promise;
}

function sinceMs(window: PeaksysWindow): number {
  return Date.parse(getPublishedRange(window).start);
}

function filterSince(items: PeaksysItems, window: PeaksysWindow): PeaksysItems {
  if (window === "7d") return items;
  const since = sinceMs(window);
  const recent = <T extends { published: string }>(list: T[]) =>
    list.filter((i) => new Date(i.published).getTime() >= since);
  return {
    ...items,
    cves: recent(items.cves),
    rssArticles: recent(items.rssArticles),
    tweets: recent(items.tweets),
  };
}

async function getReadState(): Promise<PeaksysReadIds> {
  const [cveReadIds, rssReadIds, tweetReadIds] = await Promise.all([
    getBriefReadIds("cves"),
    getReadIds(),
    getBriefReadIds("tweets"),
  ]);
  return { cveReadIds, rssReadIds, tweetReadIds };
}

export async function getPeaksysFeed(
  window: PeaksysWindow
): Promise<PeaksysItems & PeaksysReadIds & { topics: PeaksysTopic[] }> {
  const topics = await getPeaksysTopics();
  if (topics.length === 0) {
    return {
      cves: [], rssArticles: [], tweets: [], cveError: false, twitterError: null,
      cveReadIds: [], rssReadIds: [], tweetReadIds: [], topics,
    };
  }
  const [items, readIds] = await Promise.all([getItems(topics), getReadState()]);
  return { ...filterSince(items, window), ...readIds, topics };
}

/**
 * Nombre d'éléments non lus sur les dernières 24 h, la référence de la pastille
 * d'alerte de l'onglet. L'état lu est partagé avec le Brief et les News.
 */
export async function getPeaksysUnreadCount(): Promise<number> {
  const feed = await getPeaksysFeed("24h");
  return countUnread(feed, feed);
}

function countUnread(
  items: Pick<PeaksysItems, "cves" | "rssArticles" | "tweets">,
  readIds: PeaksysReadIds
): number {
  const cveRead = new Set(readIds.cveReadIds);
  const rssRead = new Set(readIds.rssReadIds);
  const tweetRead = new Set(readIds.tweetReadIds);
  return (
    items.cves.filter((c) => !cveRead.has(c.id)).length +
    items.rssArticles.filter((a) => !rssRead.has(a.id)).length +
    items.tweets.filter((t) => !tweetRead.has(t.id)).length
  );
}
