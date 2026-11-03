"use client";

import { useState, useEffect } from "react";
import type { PeaksysTopic } from "@/lib/sources/peaksys/topics";
import { refreshPeaksysUnread } from "@/components/peaksys/unreadStore";

export default function PeaksysTopicsManager() {
  const [topics, setTopics] = useState<PeaksysTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/peaksys-topics");
        const data = await res.json();
        setTopics(data.topics ?? []);
      } catch {
        setTopics([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/peaksys-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }
      setTopics(data.topics);
      setName("");
      setAliases("");
      setMessage({ type: "success", text: "Sujet ajouté." });
      refreshPeaksysUnread({ force: true });
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/peaksys-topics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setTopics(data.topics);
      refreshPeaksysUnread({ force: true });
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la suppression." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Liste des sujets */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-alt rounded animate-pulse" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-sm text-text-muted">Aucun sujet surveillé.</p>
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {topics.map((topic) => (
            <div key={topic.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {topic.name}
                </p>
                {topic.aliases.length > 0 && (
                  <p className="text-xs text-text-muted truncate">
                    Variantes : {topic.aliases.join(", ")}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(topic.id)}
                className="text-xs text-text-muted hover:text-severity-high transition-colors cursor-pointer shrink-0"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="card p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">
          Ajouter un sujet
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
              placeholder="Ex: Next.js"
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Variantes (facultatif, séparées par des virgules)
            </label>
            <input
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="Ex: NextJS, Vercel Next"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted"
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
