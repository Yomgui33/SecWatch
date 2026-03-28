import BriefDashboard from "@/components/brief/BriefDashboard";

export const metadata = {
  title: "Brief du jour — SecWatch",
  description: "Résumé quotidien : vulnérabilités critiques, articles RSS et tweets des dernières 24h.",
};

export default function BriefPage() {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-1">
          Brief du jour
        </h2>
        <p className="text-sm text-text-secondary">
          {today} — Vulnérabilités critiques, articles et tweets des dernières 24h.
        </p>
      </div>
      <BriefDashboard />
    </div>
  );
}
