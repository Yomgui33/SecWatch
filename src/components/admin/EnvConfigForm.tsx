"use client";

import { useState, useEffect } from "react";

interface ConfigStatus {
  redisConfigured: boolean;
  redisUrl: string;
  nvdConfigured: boolean;
}

export default function EnvConfigForm() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [kvUrl, setKvUrl] = useState("");
  const [kvToken, setKvToken] = useState("");
  const [nvdApiKey, setNvdApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showRedisForm, setShowRedisForm] = useState(false);
  const [showNvdForm, setShowNvdForm] = useState(false);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/admin/env-config");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleRedisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/env-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kvUrl, kvToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({ type: "success", text: "Connexion Redis configurée avec succès." });
      setKvUrl("");
      setKvToken("");
      setShowRedisForm(false);
      await checkStatus();
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNvdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/env-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nvdApiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({ type: "success", text: "Clé API NVD enregistrée." });
      setNvdApiKey("");
      setShowNvdForm(false);
      await checkStatus();
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Redis status */}
      {status && (
        <div
          className={`flex items-center gap-3 p-3 card ${
            status.redisConfigured
              ? "border-green-800/30 bg-green-900/10"
              : "border-severity-high/30 bg-severity-high-bg"
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              status.redisConfigured ? "bg-green-600" : "bg-severity-high"
            }`}
          />
          <div className="text-sm">
            {status.redisConfigured ? (
              <span>
                Redis connecté —{" "}
                <span className="font-mono text-xs text-text-muted">{status.redisUrl}</span>
              </span>
            ) : (
              <span className="text-severity-high">
                Redis non configuré — l&apos;application nécessite une connexion Redis pour fonctionner
              </span>
            )}
          </div>
        </div>
      )}

      {/* NVD status */}
      {status && (
        <div
          className={`flex items-center gap-3 p-3 card ${
            status.nvdConfigured
              ? "border-green-800/30 bg-green-900/10"
              : "border-border bg-surface-alt"
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              status.nvdConfigured ? "bg-green-600" : "bg-text-muted"
            }`}
          />
          <div className="text-sm">
            {status.nvdConfigured ? (
              <span>Clé API NVD configurée</span>
            ) : (
              <span className="text-text-muted">
                Clé API NVD non configurée{" "}
                <span className="text-xs">(optionnelle — augmente le rate limit de 5 à 50 req/30s)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        {!showRedisForm && (
          <button
            onClick={() => { setShowRedisForm(true); setMessage(null); }}
            className="px-4 py-2 text-sm pill"
          >
            {status?.redisConfigured ? "Modifier la connexion Redis" : "Configurer Redis"}
          </button>
        )}
        {!showNvdForm && (
          <button
            onClick={() => { setShowNvdForm(true); setMessage(null); }}
            className="px-4 py-2 text-sm pill"
          >
            {status?.nvdConfigured ? "Modifier la clé NVD" : "Ajouter une clé NVD"}
          </button>
        )}
      </div>

      {/* Redis form */}
      {showRedisForm && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="space-y-2 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">Connexion Upstash Redis</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
              <li>
                Créez un store gratuit sur{" "}
                <a
                  href="https://console.upstash.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  console.upstash.com
                </a>
              </li>
              <li>
                Allez dans l&apos;onglet{" "}
                <span className="font-mono bg-surface-alt px-1 rounded">REST API</span>
              </li>
              <li>
                Copiez{" "}
                <code className="font-mono bg-surface-alt px-1 rounded">UPSTASH_REDIS_REST_URL</code>{" "}
                et{" "}
                <code className="font-mono bg-surface-alt px-1 rounded">UPSTASH_REDIS_REST_TOKEN</code>
              </li>
            </ol>
          </div>

          <form onSubmit={handleRedisSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                REST API URL
              </label>
              <input
                type="url"
                value={kvUrl}
                onChange={(e) => setKvUrl(e.target.value)}
                placeholder="https://xxxx.upstash.io"
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                REST API Token
              </label>
              <input
                type="password"
                value={kvToken}
                onChange={(e) => setKvToken(e.target.value)}
                placeholder="AXxxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-full bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Test de connexion..." : "Tester et enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => { setShowRedisForm(false); setMessage(null); }}
                className="px-4 py-2 text-sm pill"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NVD form */}
      {showNvdForm && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="space-y-2 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">Clé API NVD</p>
            <p className="text-xs leading-relaxed">
              Demandez une clé gratuite sur{" "}
              <a
                href="https://nvd.nist.gov/developers/request-an-api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                nvd.nist.gov
              </a>
              . Sans clé, le rate limit est de 5 requêtes / 30 secondes.
            </p>
          </div>

          <form onSubmit={handleNvdSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                API Key
              </label>
              <input
                type="password"
                value={nvdApiKey}
                onChange={(e) => setNvdApiKey(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-full bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNvdForm(false); setMessage(null); }}
                className="px-4 py-2 text-sm pill"
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
