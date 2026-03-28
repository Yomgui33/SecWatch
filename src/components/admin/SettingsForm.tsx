"use client";

import { useState, useEffect } from "react";

export default function SettingsForm() {
  const [autoMarkRead, setAutoMarkRead] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        setAutoMarkRead(data.autoMarkReadOnClick ?? true);
      } catch { /* keep default */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleToggle = async () => {
    const next = !autoMarkRead;
    setAutoMarkRead(next);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoMarkReadOnClick: next }),
      });
    } catch {
      setAutoMarkRead(!next);
    }
  };

  if (loading) {
    return <div className="h-10 bg-surface-alt rounded animate-pulse" />;
  }

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
      <div>
        <p className="text-sm font-medium text-text-primary">
          Marquer comme lu au clic
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          Marque automatiquement un élément comme lu lorsque vous cliquez sur son lien.
        </p>
      </div>
      <button
        onClick={handleToggle}
        className={`relative shrink-0 w-10 h-6 rounded-full transition-colors cursor-pointer ${
          autoMarkRead ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            autoMarkRead ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
