import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Neva Energy — Suivi chantier",
};

export const viewport = {
  themeColor: "#0c2551",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      {/* Empêche la sélection de texte au doigt sur tout le site : sans ça,
          un geste de scroll qui frôle un mot le sélectionne au lieu de faire
          défiler la page (donne l'impression que le texte "bouge"). Les
          champs de saisie redeviennent explicitement sélectionnables via
          styleChamp (src/lib/ui.ts), sinon ils resteraient inutilisables. */}
      <body style={{ WebkitUserSelect: "none", userSelect: "none" }}>{children}</body>
    </html>
  );
}
