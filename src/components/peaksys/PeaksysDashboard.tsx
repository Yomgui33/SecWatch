"use client";

import { useState, useEffect } from "react";
import type { CveEntry } from "@/lib/sources/nvd/types";
import type { RssArticle } from "@/lib/sources/rss/types";
import type { TweetEntry } from "@/lib/sources/twitter/types";
import type { PeaksysTopic } from "@/lib/sources/peaksys/topics";
import CveCard from "@/components/cve/CveCard";
import RssArticleCard from "@/components/news/RssArticleCard";
import TweetCard from "@/components/news/TweetCard";
import { SectionHeader, MarkReadButton } from "@/components/ui/FeedSection";
import { setPeaksysUnread } from "./unreadStore";

type PeaksysWindow = "24h" | "7d";
type WithTopics<T> = T & { topics: string[] };

interface PeaksysData {
  cves: WithTopics<CveEntry>[];
  rssArticles: WithTopics<RssArticle>[];
  tweets: WithTopics<TweetEntry>[];
  cveError: boolean;
  twitterError: "credentials_missing" | "fetch_failed" | null;
  cveReadIds: string[];
  rssReadIds: string[];
  tweetReadIds: string[];
  topics: PeaksysTopic[];
}

const WINDOW_OPTIONS: { value: PeaksysWindow; label: string }[] = [
  { value: "24h", label: "24 heures" },
  { value: "7d", label: "7 jours" },
];

const DAY_MS = 86_400_000;

function TopicTags({ topics }: { topics: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-1.5">
      {topics.map((t) => (
        <span
          key={t}
          className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full bg-accent-light text-accent"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function PeaksysDashboard() {
  const [period, setPeriod] = useState<PeaksysWindow>("24h");
  const [data, setData] = useState<PeaksysData | null>(null);
  const [cveReadIds, setCveReadIds] = useState<Set<string>>(new Set());
  const [rssReadIds, setRssReadIds] = useState<Set<string>>(new Set());
  const [tweetReadIds, setTweetReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoMarkRead, setAutoMarkRead] = useState(true);
  const [showRead, setShowRead] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [res, settingsRes] = await Promise.all([
          fetch(`/api/peaksys?window=${period}`),
          fetch("/api/admin/settings"),
        ]);
        if (!res.ok) throw new Error();
        const json: PeaksysData = await res.json();
        if (cancelled) return;
        setData(json);
        setCveReadIds(new Set(json.cveReadIds));
        setRssReadIds(new Set(json.rssReadIds));
        setTweetReadIds(new Set(json.tweetReadIds));
        const settings = await settingsRes.json().catch(() => ({}));
        setAutoMarkRead(settings.autoMarkReadOnClick ?? true);
      } catch {
        if (!cancelled) setError("Impossible de charger la veille Peaksys.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  // --- Garder la pastille de l'onglet synchronisée (non lus sur 24 h) ---
  useEffect(() => {
    if (!data) return;
    const since = Date.now() - DAY_MS;
    const recent = (iso: string) => new Date(iso).getTime() >= since;
    setPeaksysUnread(
      data.cves.filter((c) => recent(c.published) && !cveReadIds.has(c.id)).length +
        data.rssArticles.filter((a) => recent(a.published) && !rssReadIds.has(a.id)).length +
        data.tweets.filter((t) => recent(t.published) && !tweetReadIds.has(t.id)).length
    );
  }, [data, cveReadIds, rssReadIds, tweetReadIds]);

  // --- Generic toggle helpers ---

  const toggleRead = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    endpoint: string,
    body: Record<string, unknown>
  ) => {
    return async (id: string, read: boolean) => {
      setter((prev) => {
        const next = new Set(prev);
        if (read) next.add(id);
        else next.delete(id);
        return next;
      });
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, id, read }),
        });
      } catch {
        setter((prev) => {
          const next = new Set(prev);
          if (read) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    };
  };

  const markAllRead = (
    ids: string[],
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    endpoint: string,
    body: Record<string, unknown>
  ) => {
    return async () => {
      if (ids.length === 0) return;
      setter((prev) => new Set([...prev, ...ids]));
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, ids }),
        });
      } catch { /* optimistic */ }
    };
  };

  const handleCveToggle = toggleRead(setCveReadIds, "/api/brief/read", { source: "cves" });
  const handleTweetToggle = toggleRead(setTweetReadIds, "/api/brief/read", { source: "tweets" });
  const handleRssToggle = toggleRead(setRssReadIds, "/api/news/rss/read", {});

  // --- Auto-mark-read on link click ---
  const handleCveLinkClick = (id: string) => {
    if (autoMarkRead && !cveReadIds.has(id)) handleCveToggle(id, true);
  };
  const handleRssLinkClick = (id: string) => {
    if (autoMarkRead && !rssReadIds.has(id)) handleRssToggle(id, true);
  };
  const handleTweetLinkClick = (id: string) => {
    if (autoMarkRead && !tweetReadIds.has(id)) handleTweetToggle(id, true);
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-2 mb-8">
      {WINDOW_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setPeriod(opt.value)}
          className={`pill ${period === opt.value ? "pill-active" : ""}`}
        >
          {opt.label}
        </button>
      ))}
      <span className="mx-1 h-4 w-px bg-border" />
      <button
        onClick={() => setShowRead((v) => !v)}
        className={`pill ${showRead ? "pill-active" : ""}`}
      >
        Afficher les lus
      </button>
    </div>
  );

  if (loading) {
    return (
      <div>
        {controls}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-surface-alt rounded-full" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3.5 w-36 bg-surface-alt rounded" />
                  <div className="h-3 w-full bg-surface-alt rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        {controls}
        <div className="text-center py-12">
          <p className="text-sm text-severity-high">{error}</p>
        </div>
      </div>
    );
  }

  if (data.topics.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-text-muted">
          Aucun sujet surveillé.{" "}
          <a href="/admin" className="text-accent hover:underline">
            Ajouter des sujets
          </a>
        </p>
      </div>
    );
  }

  const byTopic = <T extends { topics: string[] }>(list: T[]) =>
    activeTopic ? list.filter((i) => i.topics.includes(activeTopic)) : list;

  const cves = byTopic(data.cves).filter((c) => showRead || !cveReadIds.has(c.id));
  const articles = byTopic(data.rssArticles).filter((a) => showRead || !rssReadIds.has(a.id));
  const tweets = byTopic(data.tweets).filter((t) => showRead || !tweetReadIds.has(t.id));
  const isEmpty = cves.length === 0 && articles.length === 0 && tweets.length === 0;

  // Nombre d'éléments (affichés) par sujet, pour les filtres
  const topicCounts = new Map<string, number>();
  for (const list of [
    data.cves.filter((c) => showRead || !cveReadIds.has(c.id)),
    data.rssArticles.filter((a) => showRead || !rssReadIds.has(a.id)),
    data.tweets.filter((t) => showRead || !tweetReadIds.has(t.id)),
  ]) {
    for (const item of list) {
      for (const t of item.topics) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
  }

  const periodLabel = period === "24h" ? "dernières 24 heures" : "7 derniers jours";

  return (
    <div>
      {controls}

      {/* Filtre par sujet */}
      <div className="flex flex-wrap items-center gap-2 -mt-4 mb-8">
        <button
          onClick={() => setActiveTopic(null)}
          className={`pill ${activeTopic === null ? "pill-active" : ""}`}
        >
          Tous les sujets
        </button>
        {data.topics.map((topic) => {
          const count = topicCounts.get(topic.name) ?? 0;
          return (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(activeTopic === topic.name ? null : topic.name)}
              className={`pill gap-1.5 ${activeTopic === topic.name ? "pill-active" : ""} ${
                count === 0 ? "opacity-50" : ""
              }`}
            >
              {topic.name}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-10">
        {isEmpty && (
          <div className="text-center py-12 text-text-muted text-sm">
            Rien de nouveau sur vos sujets dans les {periodLabel}.
          </div>
        )}

        {/* Vulnérabilités — toutes criticités */}
        {cves.length > 0 && (
          <section>
            <SectionHeader
              title="Vulnérabilités"
              count={cves.length}
              icon="🛡️"
              collapsed={!!collapsed.cves}
              onToggleCollapse={() => toggleCollapse("cves")}
              onMarkAllRead={markAllRead(
                cves.filter((c) => !cveReadIds.has(c.id)).map((c) => c.id),
                setCveReadIds,
                "/api/brief/read",
                { source: "cves" }
              )}
            />
            {!collapsed.cves && (
              <div className="space-y-3">
                {cves.map((cve) => {
                  const read = cveReadIds.has(cve.id);
                  return (
                    <div key={cve.id}>
                      <TopicTags topics={cve.topics} />
                      <div className={read ? "opacity-50" : ""}>
                        <CveCard cve={cve} onLinkClick={handleCveLinkClick} />
                      </div>
                      <MarkReadButton read={read} onToggle={() => handleCveToggle(cve.id, !read)} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Articles RSS */}
        {articles.length > 0 && (
          <section>
            <SectionHeader
              title="Articles RSS"
              count={articles.length}
              icon="📰"
              collapsed={!!collapsed.rss}
              onToggleCollapse={() => toggleCollapse("rss")}
              onMarkAllRead={markAllRead(
                articles.filter((a) => !rssReadIds.has(a.id)).map((a) => a.id),
                setRssReadIds,
                "/api/news/rss/read",
                {}
              )}
            />
            {!collapsed.rss && (
              <div className="space-y-3">
                {articles.map((article) => (
                  <div key={article.id}>
                    <TopicTags topics={article.topics} />
                    <RssArticleCard
                      article={article}
                      read={rssReadIds.has(article.id)}
                      onToggleRead={handleRssToggle}
                      onLinkClick={handleRssLinkClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tweets */}
        {tweets.length > 0 && (
          <section>
            <SectionHeader
              title="Twitter / X"
              count={tweets.length}
              icon="🐦"
              collapsed={!!collapsed.tweets}
              onToggleCollapse={() => toggleCollapse("tweets")}
              onMarkAllRead={markAllRead(
                tweets.filter((t) => !tweetReadIds.has(t.id)).map((t) => t.id),
                setTweetReadIds,
                "/api/brief/read",
                { source: "tweets" }
              )}
            />
            {!collapsed.tweets && (
              <div className="space-y-3">
                {tweets.map((tweet) => {
                  const read = tweetReadIds.has(tweet.id);
                  return (
                    <div key={tweet.id}>
                      <TopicTags topics={tweet.topics} />
                      <div className={read ? "opacity-50" : ""}>
                        <TweetCard tweet={tweet} onLinkClick={handleTweetLinkClick} />
                      </div>
                      <MarkReadButton read={read} onToggle={() => handleTweetToggle(tweet.id, !read)} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {data.cveError && (
          <div className="card p-4 text-center">
            <p className="text-sm text-text-muted">
              Vulnérabilités indisponibles (VulnCheck).{" "}
              <a href="/admin" className="text-accent hover:underline">
                Vérifier la configuration
              </a>
            </p>
          </div>
        )}

        {data.twitterError === "credentials_missing" && (
          <div className="card p-4 text-center">
            <p className="text-sm text-text-muted">
              Twitter/X non configuré.{" "}
              <a href="/admin" className="text-accent hover:underline">
                Configurer
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
