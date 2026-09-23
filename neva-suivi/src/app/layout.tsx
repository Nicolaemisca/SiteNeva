import type { ReactNode } from "react";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { couleurs } from "@/lib/ui";

// Inter pour le texte courant (lisibilité), Oswald — condensée, très
// carrée — pour les titres et boutons : la vision "chantier industriel
// haute visibilité" (signalétique, pas de texte fin) vient surtout de la
// typo des titres/actions, le corps de texte reste en Inter pour rester
// confortable à lire. Toutes deux auto-hébergées par Next, zéro requête
// réseau en plus.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "swap" });

export const metadata = {
  title: "Neva Energy — Suivi chantier",
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${oswald.variable}`}>
      {/* Empêche la sélection de texte au doigt sur tout le site : sans ça,
          un geste de scroll qui frôle un mot le sélectionne au lieu de faire
          défiler la page (donne l'impression que le texte "bouge"). Les
          champs de saisie redeviennent explicitement sélectionnables via
          styleChamp (src/lib/ui.ts), sinon ils resteraient inutilisables. */}
      <body style={{ WebkitUserSelect: "none", userSelect: "none", background: couleurs.fondPage }}>
        {children}
      </body>
    </html>
  );
}
