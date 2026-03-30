"use client";

import { useState, useEffect } from "react";
import type { CveEntry } from "@/lib/sources/nvd/types";
import type { RssArticle } from "@/lib/sources/rss/types";
import type { TweetEntry } from "@/lib/sources/twitter/types";
import CveCard from "@/components/cve/CveCard";
import RssArticleCard from "@/components/news/RssArticleCard";
import TweetCard from "@/components/news/TweetCard";

interface BriefSettings {
  briefShowCves: boolean;
  briefShowRss: boolean;
  briefShowTweets: boolean;
  briefMinSeverity: string;
}

interface BriefData {
  cves: CveEntry[];
  rssArticles: RssArticle[];
  rssReadIds: string[];
  tweets: TweetEntry[];
  twitterError: string | null;
  cveReadIds: string[];
  tweetReadIds: string[];
  settings?: BriefSettings;
}

function SectionHeader({
  title,
  count,
  icon,
  collapsed,
  onToggleCollapse,
  onMarkAllRead,
}: {
  title: string;
  count: number;
  icon: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span
          className={`text-[10px] text-text-muted transition-transform ${
            collapsed ? "" : "rotate-90"
          }`}
        >
          ▶
        </span>
        <span className="text-base">{icon}</span>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {title}
        </h3>
      </button>
      <span className="px-2 py-0.5 text-[11px] rounded-full bg-surface-alt text-text-muted font-medium">
        {count}
      </span>
      <button
        onClick={onMarkAllRead}
        className="ml-auto pill !py-1 !px-3 !text-[11px]"
      >
        Tout marquer lu
      </button>
    </div>
  );
}

function MarkReadButton({ read, onToggle }: { read: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="mt-1 text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
    >
      {read ? "Marquer non lu" : "Marquer lu"}
    </button>
  );
}

export default function BriefDashboard() {
  const [data, setData] = useState<BriefData | null>(null);
  const [rssReadIds, setRssReadIds] = useState<Set<string>>(new Set());
  const [cveReadIds, setCveReadIds] = useState<Set<string>>(new Set());
  const [tweetReadIds, setTweetReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoMarkRead, setAutoMarkRead] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  const [briefSettings, setBriefSettings] = useState<BriefSettings>({
    briefShowCves: true,
    briefShowRss: true,
    briefShowTweets: true,
    briefMinSeverity: "CRITICAL",
  });

  useEffect(() => {
    (async () => {
      try {
        const [briefRes, settingsRes] = await Promise.all([
          fetch("/api/brief"),
          fetch("/api/admin/settings"),
        ]);
        if (!briefRes.ok) throw new Error();
        const json: BriefData = await briefRes.json();
        setData(json);
        setRssReadIds(new Set(json.rssReadIds ?? []));
        setCveReadIds(new Set(json.cveReadIds ?? []));
        setTweetReadIds(new Set(json.tweetReadIds ?? []));
        if (json.settings) setBriefSettings(json.settings);
        const settings = await settingsRes.json().catch(() => ({}));
        setAutoMarkRead(settings.autoMarkReadOnClick ?? true);
      } catch {
        setError("Impossible de charger le brief.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Sync RSS read state on tab focus ---
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && data) {
        fetch("/api/news/rss/read")
          .then((r) => r.json())
          .then((d) => setRssReadIds(new Set(d.readIds ?? [])))
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [data]);

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

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
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
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-severity-high">{error}</p>
      </div>
    );
  }

  const unreadCves = briefSettings.briefShowCves ? data.cves.filter((c) => !cveReadIds.has(c.id)) : [];
  const unreadArticles = briefSettings.briefShowRss ? data.rssArticles.filter((a) => !rssReadIds.has(a.id)) : [];
  const unreadTweets = briefSettings.briefShowTweets ? data.tweets.filter((t) => !tweetReadIds.has(t.id)) : [];
  const isEmpty = unreadCves.length === 0 && unreadArticles.length === 0 && unreadTweets.length === 0;

  return (
    <div className="space-y-10">
      {isEmpty && (
        <div className="text-center py-12 text-text-muted text-sm">
          Rien de nouveau dans les dernières 24 heures.
        </div>
      )}

      {/* CVEs critiques */}
      {unreadCves.length > 0 && (
        <section>
          <SectionHeader
            title="Vulnérabilités critiques"
            count={unreadCves.length}
            icon="🔴"
            collapsed={!!collapsed.cves}
            onToggleCollapse={() => toggleCollapse("cves")}
            onMarkAllRead={markAllRead(
              unreadCves.map((c) => c.id),
              setCveReadIds,
              "/api/brief/read",
              { source: "cves" }
            )}
          />
          {!collapsed.cves && (
            <div className="space-y-3">
              {unreadCves.map((cve) => (
                <div key={cve.id}>
                  <CveCard cve={cve} onLinkClick={handleCveLinkClick} />
                  <MarkReadButton
                    read={false}
                    onToggle={() => handleCveToggle(cve.id, true)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Articles RSS */}
      {unreadArticles.length > 0 && (
        <section>
          <SectionHeader
            title="Articles RSS"
            count={unreadArticles.length}
            icon="📰"
            collapsed={!!collapsed.rss}
            onToggleCollapse={() => toggleCollapse("rss")}
            onMarkAllRead={markAllRead(
              unreadArticles.map((a) => a.id),
              setRssReadIds,
              "/api/news/rss/read",
              {}
            )}
          />
          {!collapsed.rss && (
            <div className="space-y-3">
              {unreadArticles.map((article) => (
                <RssArticleCard
                  key={article.id}
                  article={article}
                  read={false}
                  onToggleRead={handleRssToggle}
                  onLinkClick={handleRssLinkClick}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tweets */}
      {unreadTweets.length > 0 && (
        <section>
          <SectionHeader
            title="Twitter / X"
            count={unreadTweets.length}
            icon="🐦"
            collapsed={!!collapsed.tweets}
            onToggleCollapse={() => toggleCollapse("tweets")}
            onMarkAllRead={markAllRead(
              unreadTweets.map((t) => t.id),
              setTweetReadIds,
              "/api/brief/read",
              { source: "tweets" }
            )}
          />
          {!collapsed.tweets && (
            <div className="space-y-3">
              {unreadTweets.map((tweet) => (
                <div key={tweet.id}>
                  <TweetCard tweet={tweet} onLinkClick={handleTweetLinkClick} />
                  <MarkReadButton
                    read={false}
                    onToggle={() => handleTweetToggle(tweet.id, true)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {briefSettings.briefShowTweets && data.twitterError === "credentials_missing" && (
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
  );
}
