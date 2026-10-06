import type { CveSeverity } from "./sources/nvd/types";

export const SEVERITY_CONFIG: Record<
  CveSeverity,
  { label: string; textClass: string; bgClass: string; order: number }
> = {
  CRITICAL: {
    label: "Critique",
    textClass: "text-severity-critical",
    bgClass: "bg-severity-critical-bg",
    order: 0,
  },
  HIGH: {
    label: "Haute",
    textClass: "text-severity-high",
    bgClass: "bg-severity-high-bg",
    order: 1,
  },
  MEDIUM: {
    label: "Moyenne",
    textClass: "text-severity-medium",
    bgClass: "bg-severity-medium-bg",
    order: 2,
  },
  LOW: {
    label: "Basse",
    textClass: "text-severity-low",
    bgClass: "bg-severity-low-bg",
    order: 3,
  },
  NONE: {
    label: "Non scorée",
    textClass: "text-severity-none",
    bgClass: "bg-severity-none-bg",
    order: 4,
  },
};
