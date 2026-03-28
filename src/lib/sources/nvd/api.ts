import {
  NvdCveResponse,
  CveEntry,
  CveSeverity,
  NvdCve,
} from "./types";

const NVD_API_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

function getSeverity(cve: NvdCve): { score: number | null; severity: CveSeverity; vectorString: string | null } {
  const v31 = cve.metrics?.cvssMetricV31?.[0];
  if (v31) {
    return {
      score: v31.cvssData.baseScore,
      severity: v31.cvssData.baseSeverity as CveSeverity,
      vectorString: v31.cvssData.vectorString,
    };
  }

  const v2 = cve.metrics?.cvssMetricV2?.[0];
  if (v2) {
    return {
      score: v2.cvssData.baseScore,
      severity: (v2.baseSeverity || "NONE").toUpperCase() as CveSeverity,
      vectorString: v2.cvssData.vectorString,
    };
  }

  return { score: null, severity: "NONE", vectorString: null };
}

function getDescription(cve: NvdCve): string {
  const fr = cve.descriptions.find((d) => d.lang === "fr");
  if (fr) return fr.value;
  const en = cve.descriptions.find((d) => d.lang === "en");
  return en?.value ?? "Aucune description disponible.";
}

function mapCve(cve: NvdCve): CveEntry {
  const { score, severity, vectorString } = getSeverity(cve);
  return {
    id: cve.id,
    published: cve.published,
    lastModified: cve.lastModified,
    description: getDescription(cve),
    score,
    severity,
    vectorString,
    nvdUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
  };
}

export async function fetchCves(options: {
  pubStartDate?: string;
  pubEndDate?: string;
  resultsPerPage?: number;
  startIndex?: number;
}): Promise<{ cves: CveEntry[]; totalResults: number }> {
  const params = new URLSearchParams();

  if (options.pubStartDate) params.set("pubStartDate", options.pubStartDate);
  if (options.pubEndDate) params.set("pubEndDate", options.pubEndDate);
  params.set("resultsPerPage", String(options.resultsPerPage ?? 40));
  if (options.startIndex) params.set("startIndex", String(options.startIndex));

  const headers: Record<string, string> = {};
  const apiKey = process.env.NVD_API_KEY;
  if (apiKey) {
    headers["apiKey"] = apiKey;
  }

  const url = `${NVD_API_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers,
    next: { revalidate: 1800 }, // Cache 30 minutes (ISR)
  });

  if (!res.ok) {
    throw new Error(`NVD API error: ${res.status} ${res.statusText}`);
  }

  const data: NvdCveResponse = await res.json();

  const cves = data.vulnerabilities.map((v) => mapCve(v.cve));

  return { cves, totalResults: data.totalResults };
}

export function getDateRange(filter: "24h" | "7d" | "30d"): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();

  const offsets: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const start = new Date(now.getTime() - offsets[filter]).toISOString();
  return { start, end };
}
