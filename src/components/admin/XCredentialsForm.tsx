"use client";

import { useState, useEffect } from "react";

interface Status {
  configured: boolean;
  valid?: boolean;
  screenName?: string | null;
}

export default function XCredentialsForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [ct0, setCt0] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/admin/x-credentials");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/x-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authToken, ct0 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({
        type: "success",
        text: `Connecté en tant que @${data.screenName}`,
      });
      setAuthToken("");
      setCt0("");
      setShowForm(false);
      await checkStatus();
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/admin/x-credentials", { method: "DELETE" });
      setMessage({ type: "success", text: "Déconnecté." });
      await checkStatus();
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la déconnexion." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Statut actuel */}
      {status && (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border ${
            status.configured && status.valid
              ? "border-green-800/30 bg-green-900/10"
              : status.configured && !status.valid
              ? "border-severity-high/30 bg-severity-high-bg"
              : "border-border bg-surface-alt"
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              status.configured && status.valid
                ? "bg-green-600"
                : status.configured
                ? "bg-severity-high"
                : "bg-text-muted"
            }`}
          />
          <div className="text-sm">
            {status.configured && status.valid ? (
              <span>
                Connecté en tant que{" "}
                <span className="font-medium">@{status.screenName}</span>
              </span>
            ) : status.configured && !status.valid ? (
              <span className="text-severity-high">
                Cookies expirés — renouvellement nécessaire
              </span>
            ) : (
              <span className="text-text-muted">Non configuré</span>
            )}
          </div>
          {status.configured && (
            <button
              onClick={handleDisconnect}
              className="ml-auto text-xs text-text-muted hover:text-severity-high transition-colors cursor-pointer"
            >
              Déconnecter
            </button>
          )}
        </div>
      )}

      {/* Bouton pour afficher le formulaire */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm rounded-md border border-border text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
        >
          {status?.configured ? "Renouveler les cookies" : "Configurer la connexion X"}
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          {/* Instructions */}
          <div className="space-y-2 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">Comment obtenir les cookies :</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
              <li>
                Ouvrez{" "}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  x.com
                </a>{" "}
                et connectez-vous
              </li>
              <li>
                Ouvrez les DevTools :{" "}
                <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border rounded text-xs font-mono">
                  F12
                </kbd>
              </li>
              <li>
                Onglet{" "}
                <span className="font-mono bg-surface-alt px-1 rounded">Application</span>{" "}
                &gt;{" "}
                <span className="font-mono bg-surface-alt px-1 rounded">Cookies</span>{" "}
                &gt;{" "}
                <span className="font-mono bg-surface-alt px-1 rounded">https://x.com</span>
              </li>
              <li>
                Copiez la valeur de{" "}
                <code className="font-mono bg-surface-alt px-1 rounded">auth_token</code>{" "}
                et{" "}
                <code className="font-mono bg-surface-alt px-1 rounded">ct0</code>
              </li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                auth_token
              </label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Collez la valeur du cookie auth_token"
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-text-primary placeholder:text-text-muted font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                ct0
              </label>
              <input
                type="password"
                value={ct0}
                onChange={(e) => setCt0(e.target.value)}
                placeholder="Collez la valeur du cookie ct0"
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-text-primary placeholder:text-text-muted font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-md bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Vérification..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setMessage(null);
                }}
                className="px-4 py-2 text-sm rounded-md border border-border text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

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
