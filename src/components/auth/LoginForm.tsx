"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, remember }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Connexion impossible.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-text-muted">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Entrez le mot de passe"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-[var(--color-accent)]"
        />
        Rester connecté sur cet appareil pendant 30 jours
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Connexion..." : "Se connecter"}
      </button>

      {message && <p className="text-xs text-severity-high">{message}</p>}
    </form>
  );
}
