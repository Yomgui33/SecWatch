import {
  NvdCveResponse,
  CveEntry,
  CveSeverity,
  NvdCve,
} from "./types";
import { getRuntimeConfig } from "@/lib/config";

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

async function nvdFetch(
  params: URLSearchParams,
  headers: Record<string, string>
): Promise<NvdCveResponse> {
  const url = `${NVD_API_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers,
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`NVD API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<NvdCveResponse>;
}

export async function fetchCves(options: {
  pubStartDate?: string;
  pubEndDate?: string;
  resultsPerPage?: number;
  startIndex?: number;
}): Promise<{ cves: CveEntry[]; totalResults: number }> {
  const pageSize = options.resultsPerPage ?? 40;

  const baseParams = new URLSearchParams();
  if (options.pubStartDate) baseParams.set("pubStartDate", options.pubStartDate);
  if (options.pubEndDate) baseParams.set("pubEndDate", options.pubEndDate);

  const headers: Record<string, string> = {};
  const apiKey = getRuntimeConfig().NVD_API_KEY;
  if (apiKey) headers["apiKey"] = apiKey;

  // Si startIndex est fourni explicitement, requête directe.
  if (options.startIndex !== undefined) {
    const params = new URLSearchParams(baseParams);
    params.set("resultsPerPage", String(pageSize));
    params.set("startIndex", String(options.startIndex));
    const data = await nvdFetch(params, headers);
    return {
      cves: data.vulnerabilities.map((v) => mapCve(v.cve)),
      totalResults: data.totalResults,
    };
  }

  // 1ère requête : 1 résultat pour connaître totalResults.
  // L'API NVD trie par date croissante : sans ce workaround on obtiendrait
  // uniquement les CVE les plus anciens de la fenêtre (ex. tous du premier jour).
  const probeParams = new URLSearchParams(baseParams);
  probeParams.set("resultsPerPage", "1");
  const probe = await nvdFetch(probeParams, headers);
  const totalResults = probe.totalResults;

  if (totalResults === 0) {
    return { cves: [], totalResults: 0 };
  }

  // 2ème requête : fetcher la DERNIÈRE page pour obtenir les CVE les plus récents.
  const startIndex = Math.max(0, totalResults - pageSize);
  const pageParams = new URLSearchParams(baseParams);
  pageParams.set("resultsPerPage", String(pageSize));
  pageParams.set("startIndex", String(startIndex));
  const data = await nvdFetch(pageParams, headers);

  // Trier par date de publication décroissante (plus récent en premier).
  const cves = data.vulnerabilities
    .map((v) => mapCve(v.cve))
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  return { cves, totalResults };
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
