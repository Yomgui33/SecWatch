import BriefDashboard from "@/components/brief/BriefDashboard";
import { requirePageAuth } from "@/lib/auth";

export const metadata = {
  title: "Brief du jour — SecWatch",
  description: "Résumé quotidien : vulnérabilités critiques, articles RSS et tweets des dernières 24h.",
};

export default async function HomePage() {
  await requirePageAuth();

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-tight mb-1">
          Brief du jour
        </h2>
        <p className="text-sm text-text-muted">
          {today}
        </p>
      </div>
      <BriefDashboard />
    </div>
  );
}
