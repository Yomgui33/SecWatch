import EnvConfigForm from "@/components/admin/EnvConfigForm";
import XCredentialsForm from "@/components/admin/XCredentialsForm";
import RssFeedsManager from "@/components/admin/RssFeedsManager";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata = {
  title: "Admin — SecWatch",
};

export default function AdminPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <h2 className="font-display text-2xl tracking-tight mb-1">Administration</h2>
        <p className="text-sm text-text-muted">
          Configuration des sources de données.
        </p>
      </div>

      <div className="space-y-12">
        <section className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
            Connexion aux services
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Configuration de la base de données Redis (Upstash) et de la clé API NVD.
          </p>
          <EnvConfigForm />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
            Connexion Twitter / X
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            SecWatch utilise les cookies de votre session X pour afficher votre fil
            d'abonnements. Ces cookies expirent périodiquement — cette page vous
            permet de les renouveler.
          </p>
          <XCredentialsForm />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
            Préférences
          </h3>
          <SettingsForm />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
            Flux RSS
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Gérez vos abonnements RSS. Les articles sont rafraîchis toutes les 30
            minutes.
          </p>
          <RssFeedsManager />
        </section>
      </div>
    </div>
  );
}
