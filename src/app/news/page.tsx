import NewsDashboard from "@/components/news/NewsDashboard";

export const metadata = {
  title: "News — SecWatch",
  description: "Veille cybersécurité : dernières publications Twitter/X de la communauté infosec.",
};

export default function NewsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-1">News</h2>
        <p className="text-sm text-text-secondary">
          Publications de la communauté infosec. Sources actuelles : Twitter/X via RSSHub.
        </p>
      </div>
      <NewsDashboard />
    </div>
  );
}
