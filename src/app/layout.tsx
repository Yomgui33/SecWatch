import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NavLink from "@/components/ui/NavLink";
import Logo from "@/components/ui/Logo";
import LogoutButton from "@/components/auth/LogoutButton";
import { isCurrentSessionAuthenticated } from "@/lib/auth";

export const metadata: Metadata = {
  title: "SecWatch — Veille cybersécurité",
  description: "Tableau de bord de veille cybersécurité : CVE, alertes et actualités.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isCurrentSessionAuthenticated();

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Empêcher le flash de thème incorrect */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface text-text-primary">
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="shrink-0">
                <Logo />
              </a>
              {authenticated && (
                <nav className="flex items-center gap-1">
                  <NavLink href="/">Brief</NavLink>
                  <NavLink href="/brief">Vulnérabilités</NavLink>
                  <NavLink href="/news">News</NavLink>
                  <NavLink href="/admin">Admin</NavLink>
                </nav>
              )}
            </div>
            <div className="flex items-center gap-2">
              {authenticated && <LogoutButton />}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
