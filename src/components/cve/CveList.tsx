import type { CveEntry } from "@/lib/sources/nvd/types";
import CveCard from "./CveCard";

export default function CveList({ cves }: { cves: CveEntry[] }) {
  if (cves.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        Aucune CVE ne correspond aux filtres sélectionnés.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cves.map((cve) => (
        <CveCard key={cve.id} cve={cve} />
      ))}
    </div>
  );
}
