"use client";

import { useState, useEffect } from "react";

interface ConfigStatus {
  redisConfigured: boolean;
  redisUrl: string;
  vulncheckConfigured: boolean;
  managedHosting: boolean;
  configMode: "vercel-env" | "local-runtime";
}

export default function EnvConfigForm() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [kvUrl, setKvUrl] = useState("");
  const [kvToken, setKvToken] = useState("");
  const [vulncheckToken, setVulncheckToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showRedisForm, setShowRedisForm] = useState(false);
  const [showVulncheckForm, setShowVulncheckForm] = useState(false);

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

  const handleVulncheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/env-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vulncheckToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({ type: "success", text: "Token VulnCheck enregistré." });
      setVulncheckToken("");
      setShowVulncheckForm(false);
      await checkStatus();
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {status?.managedHosting && (
        <div className="card border-accent/30 bg-accent-light/40 p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">Instance Vercel détectée</p>
          <p className="mt-1 leading-relaxed">
            Sur Vercel, SecWatch lit la configuration depuis les variables d&apos;environnement du projet.
            Les secrets Redis et VulnCheck doivent être définis dans le dashboard Vercel puis redéployés.
          </p>
        </div>
      )}

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

      {/* VulnCheck status */}
      {status && (
        <div
          className={`flex items-center gap-3 p-3 card ${
            status.vulncheckConfigured
              ? "border-green-800/30 bg-green-900/10"
              : "border-severity-high/30 bg-severity-high-bg"
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              status.vulncheckConfigured ? "bg-green-600" : "bg-severity-high"
            }`}
          />
          <div className="text-sm">
            {status.vulncheckConfigured ? (
              <span>Token VulnCheck configuré</span>
            ) : (
              <span className="text-severity-high">
                Token VulnCheck non configuré{" "}
                <span className="text-xs">(requis — les CVE ne se chargeront pas)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        {!showRedisForm && !status?.managedHosting && (
          <button
            onClick={() => { setShowRedisForm(true); setMessage(null); }}
            className="px-4 py-2 text-sm pill"
          >
            {status?.redisConfigured ? "Modifier la connexion Redis" : "Configurer Redis"}
          </button>
        )}
        {!showVulncheckForm && !status?.managedHosting && (
          <button
            onClick={() => { setShowVulncheckForm(true); setMessage(null); }}
            className="px-4 py-2 text-sm pill"
          >
            {status?.vulncheckConfigured ? "Modifier le token VulnCheck" : "Ajouter un token VulnCheck"}
          </button>
        )}
      </div>

      {status?.managedHosting && (
        <div className="rounded-lg border border-border bg-surface-alt p-4 text-xs leading-relaxed text-text-secondary">
          <p>
            Variables attendues :
            {" "}
            <code className="font-mono">UPSTASH_REDIS_REST_URL</code>,
            {" "}
            <code className="font-mono">UPSTASH_REDIS_REST_TOKEN</code>,
            {" "}
            <code className="font-mono">VULNCHECK_API_TOKEN</code>.
          </p>
          <p className="mt-2">
            Les aliases
            {" "}
            <code className="font-mono">KV_REST_API_URL</code>
            {" "}et{" "}
            <code className="font-mono">KV_REST_API_TOKEN</code>
            {" "}restent supportés en local.
          </p>
        </div>
      )}

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

      {/* VulnCheck form */}
      {showVulncheckForm && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="space-y-2 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">Token VulnCheck</p>
            <p className="text-xs leading-relaxed">
              Créez un compte Community gratuit sur{" "}
              <a
                href="https://vulncheck.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                vulncheck.com
              </a>
              {" "}et récupérez votre token depuis le dashboard.
            </p>
          </div>

          <form onSubmit={handleVulncheckSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Token
              </label>
              <input
                type="password"
                value={vulncheckToken}
                onChange={(e) => setVulncheckToken(e.target.value)}
                placeholder="vulncheck_xxxxxxxxxxxxxxxxxxxxxxxx"
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
                onClick={() => { setShowVulncheckForm(false); setMessage(null); }}
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
