import XCredentialsForm from "@/components/admin/XCredentialsForm";

export const metadata = {
  title: "Admin — SecWatch",
};

export default function AdminPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight mb-1">Administration</h2>
        <p className="text-sm text-text-secondary">
          Configuration des sources de données.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-base font-medium">Connexion Twitter / X</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          SecWatch utilise les cookies de votre session X pour afficher votre fil
          d'abonnements. Ces cookies expirent périodiquement — cette page vous
          permet de les renouveler.
        </p>
        <XCredentialsForm />
      </section>
    </div>
  );
}
