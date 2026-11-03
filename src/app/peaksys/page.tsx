import PeaksysDashboard from "@/components/peaksys/PeaksysDashboard";
import { requirePageAuth } from "@/lib/auth";

export const metadata = {
  title: "Peaksys — SecWatch",
  description: "Veille ciblée : vulnérabilités, articles RSS et tweets sur les technologies utilisées par Peaksys.",
};

export default async function PeaksysPage() {
  await requirePageAuth();

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-tight mb-1">
          Peaksys
        </h2>
        <p className="text-sm text-text-muted">
          Vulnérabilités (toutes criticités), articles et tweets mentionnant les{" "}
          <a href="/admin" className="text-accent hover:underline">
            sujets surveillés
          </a>
          .
        </p>
      </div>
      <PeaksysDashboard />
    </div>
  );
}
