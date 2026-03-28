import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NavLink from "@/components/ui/NavLink";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "SecWatch — Veille cybersécurité",
  description: "Tableau de bord de veille cybersécurité : CVE, alertes et actualités.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <a href="/" className="shrink-0">
                <Logo />
              </a>
              <nav className="flex items-center gap-3 border-l border-border pl-4">
                <NavLink href="/brief">Brief</NavLink>
                <NavLink href="/">Vulnérabilités</NavLink>
                <NavLink href="/news">News</NavLink>
                <NavLink href="/admin">Admin</NavLink>
              </nav>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
