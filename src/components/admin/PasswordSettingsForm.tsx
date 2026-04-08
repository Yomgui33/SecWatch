"use client";

import { useEffect, useState } from "react";

interface PasswordStatus {
  usesDefaultPassword: boolean;
}

export default function PasswordSettingsForm() {
  const [status, setStatus] = useState<PasswordStatus | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadStatus = async () => {
    try {
      const res = await fetch("/api/admin/password");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "La confirmation ne correspond pas au nouveau mot de passe." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Mise à jour impossible." });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Mot de passe mis à jour. Les autres sessions ont été invalidées." });
      await loadStatus();
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {status?.usesDefaultPassword && (
        <div className="card border-severity-high/30 bg-severity-high-bg p-4 text-sm text-severity-high">
          Le mot de passe par défaut <span className="font-medium">SecWatch4you</span> est encore actif.
          Modifiez-le avant le déploiement en production.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Mot de passe actuel
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-text-muted">
            Minimum 8 caractères.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </button>
      </form>

      {message && (
        <p className={`text-xs ${message.type === "success" ? "text-green-600" : "text-severity-high"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
