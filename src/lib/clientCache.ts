"use client";

import { useSyncExternalStore } from "react";

/**
 * Cache mémoire côté navigateur pour les réponses des API de contenu.
 * Il survit aux navigations client (next/link) et permet de passer d'un
 * onglet à l'autre sans recharger les données. Le bouton de rafraîchissement
 * du header vide le cache et incrémente `version`, ce qui relance les
 * chargements des dashboards montés.
 */

const TTL_MS = 15 * 60_000;

const store = new Map<string, { at: number; data: unknown }>();
let version = 0;
const listeners = new Set<() => void>();

export interface CachedResponse<T> {
  ok: boolean;
  data: T;
  fromCache: boolean;
}

export async function fetchCached<T>(url: string): Promise<CachedResponse<T>> {
  const hit = store.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return { ok: true, data: hit.data as T, fromCache: true };
  }

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  // Les réponses en erreur (y compris `error` en 200, ex. cookies X expirés)
  // ne sont pas mises en cache pour ne pas masquer une correction.
  if (res.ok && !(data && typeof data === "object" && "error" in data)) {
    store.set(url, { at: Date.now(), data });
  }
  return { ok: res.ok, data: data as T, fromCache: false };
}

/**
 * États « lu » à jour. Les réponses Brief/Peaksys les embarquent, mais une
 * copie en cache peut être périmée (éléments marqués lus depuis un autre onglet).
 */
export async function fetchReadIds() {
  const [brief, rss] = await Promise.all([
    fetch("/api/brief/read").then((r) => r.json()),
    fetch("/api/news/rss/read").then((r) => r.json()),
  ]);
  return {
    cveReadIds: (brief.cveReadIds ?? []) as string[],
    tweetReadIds: (brief.tweetReadIds ?? []) as string[],
    rssReadIds: (rss.readIds ?? []) as string[],
  };
}

export function clearClientCache() {
  store.clear();
  version++;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Change à chaque rafraîchissement manuel : à mettre dans les dépendances des chargements. */
export function useCacheVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => 0);
}
