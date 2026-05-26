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

/** Formate une Date en YYYY-MM-DD pour VulnCheck */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Calcule la fenêtre lastModified à utiliser pour un filtre donné.
 *
 * Les CVEs publiés aujourd'hui n'ont pas encore de score CVSS (analyse prend
 * 2-3 jours). On requête donc par lastModified avec un décalage de 2 jours :
 *   - "24h"  → modifiés entre J-3 et J-2
 *   - "7d"   → modifiés entre J-9 et J-2
 *   - "30d"  → modifiés entre J-32 et J-2
 * Cela cible les CVEs qui viennent de recevoir leur score CVSS.
 */
export function getLastModRange(filter: "24h" | "7d" | "30d"): {
  start: string;
  end: string;
} {
  const now = new Date();
  const ANALYSIS_LAG_DAYS = 2; // délai moyen avant qu'un CVE soit scoré

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - ANALYSIS_LAG_DAYS);

  const windowDays: Record<string, number> = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
  };

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - windowDays[filter]);

  return { start: toDateStr(startDate), end: toDateStr(endDate) };
}

export async function fetchCvesFromVulnCheck(options: {
  lastModStartDate?: string;
  lastModEndDate?: string;
  pubStartDate?: string;
  pubEndDate?: string;
  limit?: number;
  page?: number;
}): Promise<{ cves: CveEntry[]; totalResults: number }> {
  const token = getRuntimeConfig().VULNCHECK_API_TOKEN;
  if (!token) throw new Error("VULNCHECK_API_TOKEN non configuré.");

  const params = new URLSearchParams();
  if (options.lastModStartDate) params.set("lastModStartDate", options.lastModStartDate);
  if (options.lastModEndDate)   params.set("lastModEndDate",   options.lastModEndDate);
  if (options.pubStartDate)     params.set("pubStartDate",     options.pubStartDate);
  if (options.pubEndDate)       params.set("pubEndDate",       options.pubEndDate);
  params.set("limit", String(options.limit ?? 100));
  if (options.page && options.page > 1) params.set("page", String(options.page));

  const url = `${VULNCHECK_API_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`VulnCheck API error: ${res.status} ${res.statusText}`);
  }

  const data: VulnCheckResponse = await res.json();

  // VulnCheck trie par _id décroissant (plus récent en premier).
  const cves = (data.data ?? []).map(mapCve);

  return { cves, totalResults: data._meta?.total_documents ?? cves.length };
}
