"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { TweetEntry, NewsFilters as FiltersType } from "@/lib/sources/twitter/types";
import NewsFilters from "./NewsFilters";
import TweetCard from "./TweetCard";

export default function NewsDashboard() {
  const [filters, setFilters] = useState<FiltersType>({
    sources: ["twitter"],
    dateFilter: "all",
  });
  const [tweets, setTweets] = useState<TweetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    } catch {
      setError("Impossible de charger les publications. Réessayez dans quelques instants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrage local
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;

  const filtered = tweets.filter((tweet) => {
    if (!filters.sources.includes(tweet.source)) return false;
    if (filters.dateFilter === "24h") {
      return now - new Date(tweet.published).getTime() < h24;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <NewsFilters filters={filters} onChange={setFilters} totalResults={filtered.length} />

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
      ) : loading ? (
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
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-severity-high mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          Aucune publication ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      )}
    </div>
  );
}
