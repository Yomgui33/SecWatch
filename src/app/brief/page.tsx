import CveDashboard from "@/components/cve/CveDashboard";
import { requirePageAuth } from "@/lib/auth";

export const metadata = {
  title: "Vulnérabilités — SecWatch",
};

export default async function VulnerabilitiesPage() {
  await requirePageAuth();

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-tight mb-1">
          Vulnérabilités
        </h2>
        <p className="text-sm text-text-muted">
          Données{" "}
          <a
            href="https://vulncheck.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            VulnCheck
          </a>
          {" "}· mise à jour toutes les 30 min.
        </p>
      </div>
      <CveDashboard />
    </div>
  );
}
