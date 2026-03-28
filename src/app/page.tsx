import CveDashboard from "@/components/cve/CveDashboard";

export default function HomePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-1">
          Dernières vulnérabilités
        </h2>
        <p className="text-sm text-text-secondary">
          Données issues de la{" "}
          <a
            href="https://nvd.nist.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            National Vulnerability Database
          </a>{" "}
          (NVD). Mise à jour toutes les 30 minutes.
        </p>
      </div>
      <CveDashboard />
    </div>
  );
}
