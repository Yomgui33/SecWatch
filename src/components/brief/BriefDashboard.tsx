"use client";

import { useState, useEffect } from "react";
import type { CveEntry } from "@/lib/sources/nvd/types";
import type { RssArticle } from "@/lib/sources/rss/types";
import type { TweetEntry } from "@/lib/sources/twitter/types";
import CveCard from "@/components/cve/CveCard";
import RssArticleCard from "@/components/news/RssArticleCard";
import TweetCard from "@/components/news/TweetCard";

interface BriefData {
  cves: CveEntry[];
  rssArticles: RssArticle[];
  readIds: string[];
  tweets: TweetEntry[];
  twitterError: string | null;
}

function SectionHeader({ title, count, icon }: { title: string; count: number; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
        {title}
      </h3>
      <span className="px-2 py-0.5 text-xs rounded-full bg-surface-alt text-text-muted font-medium">
        {count}
      </span>
    </div>
  );
}

export default function BriefDashboard() {
  const [data, setData] = useState<BriefData | null>(null);
  const [readIdsSet, setReadIdsSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/brief");
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
        setReadIdsSet(new Set(json.readIds ?? []));
      } catch {
        setError("Impossible de charger le brief.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggleRead = async (id: string, read: boolean) => {
    setReadIdsSet((prev) => {
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
      setReadIdsSet((prev) => {
        const next = new Set(prev);
        if (read) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-surface-alt rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-surface-alt rounded" />
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

  const isEmpty = data.cves.length === 0 && data.rssArticles.length === 0 && data.tweets.length === 0;

  return (
    <div className="space-y-10">
      {isEmpty && (
        <div className="text-center py-12 text-text-muted text-sm">
          Rien de nouveau dans les dernières 24 heures.
        </div>
      )}

      {/* CVEs critiques */}
      {data.cves.length > 0 && (
        <section>
          <SectionHeader title="Vulnérabilités critiques" count={data.cves.length} icon="🔴" />
          <div className="space-y-3">
            {data.cves.map((cve) => (
              <CveCard key={cve.id} cve={cve} />
            ))}
          </div>
        </section>
      )}

      {/* Articles RSS */}
      {data.rssArticles.length > 0 && (
        <section>
          <SectionHeader title="Articles RSS" count={data.rssArticles.length} icon="📰" />
          <div className="space-y-3">
            {data.rssArticles.map((article) => (
              <RssArticleCard
                key={article.id}
                article={article}
                read={readIdsSet.has(article.id)}
                onToggleRead={handleToggleRead}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tweets */}
      {data.tweets.length > 0 && (
        <section>
          <SectionHeader title="Twitter / X" count={data.tweets.length} icon="🐦" />
          <div className="space-y-3">
            {data.tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        </section>
      )}

      {data.twitterError === "credentials_missing" && (
        <div className="border border-border rounded-lg p-4 text-center">
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
