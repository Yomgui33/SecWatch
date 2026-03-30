import NewsDashboard from "@/components/news/NewsDashboard";

export const metadata = {
  title: "News — SecWatch",
  description: "Veille cybersécurité : dernières publications Twitter/X de la communauté infosec.",
};

export default function NewsPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-tight mb-1">News</h2>
        <p className="text-sm text-text-muted">
          Publications de la communauté infosec.
        </p>
      </div>
      <NewsDashboard />
    </div>
  );
}
