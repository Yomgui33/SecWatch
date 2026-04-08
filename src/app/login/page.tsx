import { redirectIfAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Connexion — SecWatch",
};

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="card p-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl tracking-tight">Accès protégé</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Saisissez le mot de passe de SecWatch pour accéder au tableau de bord.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
