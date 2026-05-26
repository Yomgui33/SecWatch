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
      temporalScore?: number;
      environmentalScore?: number;
    };
    exploitabilityScore?: number;
    impactScore?: number;
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
  _timestamp: string;
}

interface VulnCheckMeta {
  total_documents: number;
  total_pages: number;
  page: number;
  limit: number;
}

interface VulnCheckResponse {
  data: VulnCheckCve[];
  _meta: VulnCheckMeta;
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

export async function fetchCvesFromVulnCheck(options: {
  pubStartDate?: string;
  pubEndDate?: string;
  limit?: number;
  page?: number;
}): Promise<{ cves: CveEntry[]; totalResults: number }> {
  const token = getRuntimeConfig().VULNCHECK_API_TOKEN;
  if (!token) throw new Error("VULNCHECK_API_TOKEN non configuré.");

  const params = new URLSearchParams();
  // VulnCheck attend le format YYYY-MM-DD
  if (options.pubStartDate) params.set("pubStartDate", options.pubStartDate);
  if (options.pubEndDate)   params.set("pubEndDate",   options.pubEndDate);
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

  // VulnCheck trie par défaut en descendant (_id desc) — les plus récents en premier.
  const cves = (data.data ?? []).map(mapCve);

  return { cves, totalResults: data._meta?.total_documents ?? cves.length };
}

/** Convertit une date ISO (produite par getDateRange) en YYYY-MM-DD pour VulnCheck */
export function isoToDate(iso: string): string {
  return iso.slice(0, 10);
}
