import { CveEntry, CveSeverity } from "@/lib/sources/nvd/types";
import { getRuntimeConfig } from "@/lib/config";

const VULNCHECK_API_BASE = "https://api.vulncheck.com/v3/index/nist-nvd2";

// VulnCheck utilise la même structure CVSS que NVD 2.0
interface VulnCheckMetrics {
  cvssMetricV31?: Array<{
    source: string;
    type: string;
    cvssData: {
      version: string;
      vectorString: string;
      baseScore: number;
      baseSeverity: string;
    };
  }>;
  cvssMetricV2?: Array<{
    source: string;
    type: string;
    cvssData: {
      version: string;
      vectorString: string;
      baseScore: number;
    };
    baseSeverity?: string;
  }>;
}

interface VulnCheckCve {
  id: string;
  published: string;
  lastModified: string;
  descriptions: Array<{ lang: string; value: string }>;
  metrics: VulnCheckMetrics;
}

interface VulnCheckResponse {
  data: VulnCheckCve[];
  _meta: {
    total_documents: number;
    total_pages: number;
    page: number;
    limit: number;
  };
}

function getSeverity(metrics: VulnCheckMetrics): {
  score: number | null;
  severity: CveSeverity;
  vectorString: string | null;
} {
  const v31 = metrics?.cvssMetricV31?.[0];
  if (v31) {
    return {
      score: v31.cvssData.baseScore,
      severity: v31.cvssData.baseSeverity as CveSeverity,
      vectorString: v31.cvssData.vectorString,
    };
  }

  const v2 = metrics?.cvssMetricV2?.[0];
  if (v2) {
    return {
      score: v2.cvssData.baseScore,
      severity: ((v2.baseSeverity ?? "NONE").toUpperCase()) as CveSeverity,
      vectorString: v2.cvssData.vectorString,
    };
  }

  return { score: null, severity: "NONE", vectorString: null };
}

function getDescription(descriptions: VulnCheckCve["descriptions"]): string {
  const fr = descriptions.find((d) => d.lang === "fr");
  if (fr) return fr.value;
  const en = descriptions.find((d) => d.lang === "en");
  return en?.value ?? "Aucune description disponible.";
}

function mapCve(cve: VulnCheckCve): CveEntry {
  const { score, severity, vectorString } = getSeverity(cve.metrics ?? {});
  return {
    id: cve.id,
    published: cve.published,
    lastModified: cve.lastModified,
    description: getDescription(cve.descriptions ?? []),
    score,
    severity,
    vectorString,
    nvdUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
  };
}

/** Formate une Date en YYYY-MM-DD (UTC) pour VulnCheck */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

export interface PublishedRange {
  /** Borne basse incluse, timestamp ISO complet */
  start: string;
  /** Borne haute incluse, timestamp ISO complet */
  end: string;
}

const WINDOW_HOURS: Record<"24h" | "7d" | "30d", number> = {
  "24h": 24,
  "7d": 7 * 24,
  "30d": 30 * 24,
};

/**
 * Fenêtre de *publication* correspondant à un filtre prédéfini : exactement les
 * N dernières heures glissantes, se terminant maintenant.
 *
 * On filtre bien sur `published` et non sur `lastModified` : c'est la date que
 * les cartes affichent, donc la seule qui rende la sélection cohérente avec ce
 * que l'utilisateur voit. Conséquence assumée : les CVE très récentes n'ont pas
 * encore de score CVSS (l'analyse NVD prend 2-3 jours) et apparaissent en
 * sévérité "NONE".
 */
export function getPublishedRange(filter: "24h" | "7d" | "30d"): PublishedRange {
  const now = new Date();
  return {
    start: new Date(now.getTime() - WINDOW_HOURS[filter] * 3_600_000).toISOString(),
    end: now.toISOString(),
  };
}

/**
 * Convertit deux dates `YYYY-MM-DD` (inputs `type="date"`) en fenêtre de
 * publication couvrant les journées complètes en UTC. Renvoie `null` si les
 * entrées sont malformées ou inversées.
 */
export function parseCustomRange(start: string, end: string): PublishedRange | null {
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) return null;

  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T23:59:59.999Z`);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || startMs > endMs) return null;

  return { start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() };
}

const PAGE_SIZE = 100;
/** Garde-fou : au-delà, on tronque en conservant les CVE les plus récentes. */
const MAX_PAGES = 10;

async function fetchPage(
  range: PublishedRange,
  page: number,
  token: string
): Promise<VulnCheckResponse> {
  const params = new URLSearchParams();
  // L'API filtre à la journée : on élargit d'un jour de chaque côté pour ne pas
  // perdre les bornes, le filtrage exact est refait ci-dessous sur `published`.
  params.set("pubStartDate", toDateStr(addDays(new Date(range.start), -1)));
  params.set("pubEndDate", toDateStr(addDays(new Date(range.end), 1)));
  params.set("limit", String(PAGE_SIZE));
  if (page > 1) params.set("page", String(page));

  const res = await fetch(`${VULNCHECK_API_BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`VulnCheck API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<VulnCheckResponse>;
}

/**
 * Récupère les CVE **publiées** dans la fenêtre donnée.
 *
 * La fenêtre est appliquée deux fois : côté API (à la journée, en élargi) puis
 * localement au timestamp près. Ce second passage est indispensable — sans lui,
 * l'arrondi à la journée de VulnCheck fait remonter des CVE hors plage.
 */
export async function fetchCvesPublishedBetween(
  range: PublishedRange
): Promise<{ cves: CveEntry[]; totalResults: number }> {
  const token = getRuntimeConfig().VULNCHECK_API_TOKEN;
  if (!token) throw new Error("VULNCHECK_API_TOKEN non configuré.");

  const first = await fetchPage(range, 1, token);
  const pages = [first];

  // VulnCheck renvoie les documents du plus récent au plus ancien : les pages
  // suivantes complètent la fenêtre vers le passé.
  const totalPages = Math.min(first._meta?.total_pages ?? 1, MAX_PAGES);
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(range, i + 2, token))
    );
    pages.push(...rest);
  }

  const startMs = Date.parse(range.start);
  const endMs = Date.parse(range.end);

  const byId = new Map<string, CveEntry>();
  for (const page of pages) {
    for (const raw of page.data ?? []) {
      const cve = mapCve(raw);
      const publishedMs = Date.parse(cve.published);
      if (Number.isNaN(publishedMs) || publishedMs < startMs || publishedMs > endMs) continue;
      byId.set(cve.id, cve);
    }
  }

  const cves = [...byId.values()].sort(
    (a, b) => Date.parse(b.published) - Date.parse(a.published)
  );

  return { cves, totalResults: cves.length };
}
