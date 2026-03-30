"use client";

import { useState, useEffect } from "react";
import type { RssFeed } from "@/lib/sources/rss/types";

export default function RssFeedsManager() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchFeeds = async () => {
    try {
      const res = await fetch("/api/admin/rss-feeds");
      const data = await res.json();
      setFeeds(data.feeds ?? []);
    } catch {
      setFeeds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/rss-feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }
      setFeeds(data.feeds);
      setName("");
      setUrl("");
      setMessage({ type: "success", text: "Flux ajouté." });
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/rss-feeds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setFeeds(data.feeds);
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la suppression." });
    }
  };

  const handleSeed = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/rss-feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: true }),
      });
      const data = await res.json();
      setFeeds(data.feeds);
      setMessage({ type: "success", text: "Flux par défaut chargés." });
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Liste des flux */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-alt rounded animate-pulse" />
          ))}
        </div>
      ) : feeds.length === 0 ? (
        <div className="card p-4 text-center space-y-3">
          <p className="text-sm text-text-muted">Aucun flux RSS configuré.</p>
          <button
            onClick={handleSeed}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-full bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            Charger les flux par défaut
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {feed.name}
                </p>
                <p className="text-xs text-text-muted truncate">{feed.url}</p>
              </div>
              <button
                onClick={() => handleDelete(feed.id)}
                className="text-xs text-text-muted hover:text-severity-high transition-colors cursor-pointer shrink-0"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton seed si des flux existent déjà */}
      {feeds.length > 0 && (
        <button
          onClick={handleSeed}
          disabled={submitting}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          Réinitialiser les flux par défaut
        </button>
      )}

      {/* Formulaire d'ajout */}
      <div className="card p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">
          Ajouter un flux RSS
        </p>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Krebs on Security"
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              URL du flux
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-full bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Ajout..." : "Ajouter"}
          </button>
        </form>
      </div>

      {/* Message */}
      {message && (
        <p
          className={`text-xs ${
            message.type === "success" ? "text-green-600" : "text-severity-high"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
