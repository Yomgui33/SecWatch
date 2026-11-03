"use client";

import { useSyncExternalStore } from "react";

/**
 * Compteur de non lus Peaksys (24 h) partagé par toutes les instances de la
 * pastille (menu desktop et mobile) et mis à jour par le dashboard Peaksys.
 */

/** Intervalle minimal entre deux requêtes non forcées */
const MIN_REFRESH_MS = 30_000;

let unread: number | null = null;
let lastFetchAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setPeaksysUnread(count: number) {
  if (unread === count) return;
  unread = count;
  emit();
}

export function refreshPeaksysUnread({ force = false }: { force?: boolean } = {}): Promise<void> {
  if (inflight) return inflight;
  if (!force && Date.now() - lastFetchAt < MIN_REFRESH_MS) return Promise.resolve();

  lastFetchAt = Date.now();
  inflight = fetch("/api/peaksys?count=1")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d && typeof d.unread === "number") setPeaksysUnread(d.unread);
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePeaksysUnread(): number | null {
  return useSyncExternalStore(subscribe, () => unread, () => null);
}
