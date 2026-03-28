"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { TweetEntry, NewsFilters as FiltersType } from "@/lib/sources/twitter/types";
import type { RssArticle } from "@/lib/sources/rss/types";
import NewsFilters from "./NewsFilters";
import TweetCard from "./TweetCard";
import RssArticleCard from "./RssArticleCard";
import RssFeedFilter from "./RssFeedFilter";

export default function NewsDashboard() {
  const [filters, setFilters] = useState<FiltersType>({
    activeSource: "twitter",
    dateFilter: "all",
  });

  // --- Twitter state ---
  const [tweets, setTweets] = useState<TweetEntry[]>([]);
  const [twitterLoading, setTwitterLoading] = useState(false);
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const twitterFetched = useRef(false);

  // --- RSS state ---
  const [rssArticles, setRssArticles] = useState<RssArticle[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [rssLoading, setRssLoading] = useState(false);
  const [rssError, setRssError] = useState<string | null>(null);
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(new Set());
  const [hideRead, setHideRead] = useState(false);
  const rssFetched = useRef(false);

  // --- Fetch Twitter ---
  const fetchTweets = useCallback(async () => {
    if (twitterFetched.current) return;
    setTwitterLoading(true);
    setTwitterError(null);
    setCredentialsError(null);

    try {
      const res = await fetch("/api/news/tweets");
      const data = await res.json();

      if (data.error === "credentials_missing" || data.error === "cookies_expired") {
        setCredentialsError(data.message);
        return;
      }
      if (!res.ok) throw new Error("Erreur serveur");

      setTweets(data.tweets ?? []);
      twitterFetched.current = true;
    } catch {
      setTwitterError("Impossible de charger les publications. Réessayez dans quelques instants.");
    } finally {
      setTwitterLoading(false);
    }
  }, []);

  // --- Fetch RSS ---
  const fetchRss = useCallback(async () => {
    if (rssFetched.current) return;
    setRssLoading(true);
    setRssError(null);

    try {
      const [articlesRes, readRes] = await Promise.all([
        fetch("/api/news/rss"),
        fetch("/api/news/rss/read"),
      ]);
      const articlesData = await articlesRes.json();
      const readData = await readRes.json();

      if (!articlesRes.ok) throw new Error("Erreur serveur");

      setRssArticles(articlesData.articles ?? []);
      setReadIds(new Set(readData.readIds ?? []));
      rssFetched.current = true;
    } catch {
      setRssError("Impossible de charger les flux RSS.");
    } finally {
      setRssLoading(false);
    }
  }, []);

  // --- Fetch on source change ---
  useEffect(() => {
    if (filters.activeSource === "twitter") fetchTweets();
    if (filters.activeSource === "rss") fetchRss();
  }, [filters.activeSource, fetchTweets, fetchRss]);

  // --- RSS: toggle read ---
  const handleToggleRead = async (id: string, read: boolean) => {
    // Optimistic update
    setReadIds((prev) => {
      const next = new Set(prev);
      if (read) next.add(id);
      else next.delete(id);
      return next;
    });

    try {
      await fetch("/api/news/rss/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read }),
      });
    } catch {
      // Revert on error
      setReadIds((prev) => {
        const next = new Set(prev);
        if (read) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  // --- RSS: mark all as read ---
  const handleMarkAllRead = async () => {
    const ids = filteredRss.map((a) => a.id);
    setReadIds((prev) => new Set([...prev, ...ids]));

    try {
      await fetch("/api/news/rss/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    } catch {
      // Silently fail — optimistic state remains
    }
  };

  // --- RSS: toggle feed filter ---
  const handleToggleFeed = (feedId: string) => {
    setSelectedFeeds((prev) => {
      const next = new Set(prev);
      if (next.has(feedId)) next.delete(feedId);
      else next.add(feedId);
      return next;
    });
  };

  // --- Filtering ---
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;

  const filteredTweets = tweets.filter((tweet) => {
    if (filters.dateFilter === "24h") {
      return now - new Date(tweet.published).getTime() < h24;
    }
    return true;
  });

  const filteredRss = rssArticles.filter((a) => {
    if (selectedFeeds.size > 0 && !selectedFeeds.has(a.feedId)) return false;
    if (filters.dateFilter === "24h" && now - new Date(a.published).getTime() >= h24) return false;
    if (hideRead && readIds.has(a.id)) return false;
    return true;
  });

  const rssUnreadCount = filteredRss.filter((a) => !readIds.has(a.id)).length;

  // --- Skeleton ---
  const skeleton = (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-surface-alt rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-surface-alt rounded" />
              <div className="h-3 w-full bg-surface-alt rounded" />
              <div className="h-3 w-3/4 bg-surface-alt rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <NewsFilters
        filters={filters}
        onChange={setFilters}
        totalResults={filters.activeSource === "twitter" ? filteredTweets.length : filteredRss.length}
        unreadCount={filters.activeSource === "rss" ? rssUnreadCount : undefined}
      />

      {/* === TWITTER === */}
      {filters.activeSource === "twitter" && (
        <>
          {credentialsError ? (
            <div className="border border-border rounded-lg p-6 text-center space-y-3">
              <p className="text-sm text-text-secondary">{credentialsError}</p>
              <Link
                href="/admin"
                className="inline-block px-4 py-2 text-sm rounded-md bg-accent text-white hover:opacity-90 transition-opacity"
              >
                Configurer la connexion X
              </Link>
            </div>
          ) : twitterLoading ? (
            skeleton
          ) : twitterError ? (
            <div className="text-center py-12">
              <p className="text-sm text-severity-high mb-3">{twitterError}</p>
              <button
                onClick={() => { twitterFetched.current = false; fetchTweets(); }}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          ) : filteredTweets.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              Aucune publication ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTweets.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          )}
        </>
      )}

      {/* === RSS === */}
      {filters.activeSource === "rss" && (
        <>
          {rssLoading ? (
            skeleton
          ) : rssError ? (
            <div className="text-center py-12">
              <p className="text-sm text-severity-high mb-3">{rssError}</p>
              <button
                onClick={() => { rssFetched.current = false; fetchRss(); }}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <>
              <RssFeedFilter
                articles={rssArticles}
                readIds={readIds}
                selectedFeeds={selectedFeeds}
                onToggleFeed={handleToggleFeed}
                hideRead={hideRead}
                onToggleHideRead={() => setHideRead((h) => !h)}
                onMarkAllRead={handleMarkAllRead}
              />

              {filteredRss.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">
                  Aucun article ne correspond aux filtres sélectionnés.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRss.map((article) => (
                    <RssArticleCard
                      key={article.id}
                      article={article}
                      read={readIds.has(article.id)}
                      onToggleRead={handleToggleRead}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
