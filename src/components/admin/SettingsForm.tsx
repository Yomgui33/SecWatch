"use client";

import { useState, useEffect } from "react";

type BriefSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface Settings {
  autoMarkReadOnClick: boolean;
  briefShowCves: boolean;
  briefShowRss: boolean;
  briefShowTweets: boolean;
  briefMinSeverity: BriefSeverity;
}

const SEVERITY_OPTIONS: { value: BriefSeverity; label: string }[] = [
  { value: "CRITICAL", label: "Critique uniquement" },
  { value: "HIGH", label: "Haute et plus" },
  { value: "MEDIUM", label: "Moyenne et plus" },
  { value: "LOW", label: "Basse et plus" },
];

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors cursor-pointer ${
        enabled ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 card">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}


export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({
    autoMarkReadOnClick: true,
    briefShowCves: true,
    briefShowRss: true,
    briefShowTweets: true,
    briefMinSeverity: "CRITICAL",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = async (patch: Partial<Settings>) => {
    const prev = { ...settings };
    setSettings((s) => ({ ...s, ...patch }));
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      setSettings(prev);
    }
  };

  if (loading) {
    return <div className="h-10 bg-surface-alt rounded animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* General */}
      <SettingRow
        label="Marquer comme lu au clic"
        description="Marque automatiquement un élément comme lu lorsque vous cliquez sur son lien."
      >
        <Toggle
          enabled={settings.autoMarkReadOnClick}
          onToggle={() => update({ autoMarkReadOnClick: !settings.autoMarkReadOnClick })}
        />
      </SettingRow>

      {/* Brief configuration */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Contenu du brief
        </h4>
        <div className="space-y-2">
          <SettingRow
            label="Vulnérabilités (CVE)"
            description="Afficher les CVE dans le brief quotidien."
          >
            <Toggle
              enabled={settings.briefShowCves}
              onToggle={() => update({ briefShowCves: !settings.briefShowCves })}
            />
          </SettingRow>

          {settings.briefShowCves && (
            <div className="flex items-center justify-between gap-4 p-4 ml-5 card border-dashed">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Sévérité minimum
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Niveau de gravité minimum des CVE affichées dans le brief.
                </p>
              </div>
              <select
                value={settings.briefMinSeverity}
                onChange={(e) =>
                  update({ briefMinSeverity: e.target.value as BriefSeverity })
                }
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-surface text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <SettingRow
            label="Articles RSS"
            description="Afficher les articles RSS dans le brief quotidien."
          >
            <Toggle
              enabled={settings.briefShowRss}
              onToggle={() => update({ briefShowRss: !settings.briefShowRss })}
            />
          </SettingRow>

          <SettingRow
            label="Twitter / X"
            description="Afficher les tweets dans le brief quotidien."
          >
            <Toggle
              enabled={settings.briefShowTweets}
              onToggle={() => update({ briefShowTweets: !settings.briefShowTweets })}
            />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
