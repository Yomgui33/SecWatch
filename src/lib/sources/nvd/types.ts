export interface NvdCveResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: NvdVulnerability[];
}

export interface NvdVulnerability {
  cve: NvdCve;
}

export interface NvdCve {
  id: string;
  published: string;
  lastModified: string;
  descriptions: NvdDescription[];
  metrics?: NvdMetrics;
  references?: NvdReference[];
}

export interface NvdDescription {
  lang: string;
  value: string;
}

export interface NvdMetrics {
  cvssMetricV31?: CvssMetricV31[];
  cvssMetricV2?: CvssMetricV2[];
}

export interface CvssMetricV31 {
  source: string;
  type: string;
  cvssData: {
    version: string;
    vectorString: string;
    baseScore: number;
    baseSeverity: string;
  };
}

export interface CvssMetricV2 {
  source: string;
  type: string;
  cvssData: {
    version: string;
    vectorString: string;
    baseScore: number;
  };
  baseSeverity: string;
}

export interface NvdReference {
  url: string;
  source?: string;
}

// Modèle unifié pour l'affichage
export interface CveEntry {
  id: string;
  published: string;
  lastModified: string;
  description: string;
  score: number | null;
  severity: CveSeverity;
  vectorString: string | null;
  nvdUrl: string;
}

export type CveSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type DateFilter = "24h" | "7d" | "30d" | "custom";

export type SortOrder = "severity" | "date";

export interface CveFilters {
  severities: CveSeverity[];
  dateFilter: DateFilter;
  sortBy: SortOrder;
  customStart?: string;
  customEnd?: string;
}
