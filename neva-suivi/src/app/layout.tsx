import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { couleurs } from "@/lib/ui";

// Remplace la pile "sans-serif" générique par une typo humaniste pensée pour
// l'écran (Inter) — auto-hébergée par Next au build, aucune requête réseau
// en plus, aucun flash de police non stylée. Chargée une seule fois ici et
// exposée en variable CSS : les pages n'ont rien à faire, elles héritent
// déjà de `font-family: sans-serif` sur <main>, que globals.css redirige
// vers cette variable.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = {
  title: "Neva Energy — Suivi chantier",
};

export const viewport = {
  themeColor: "#0c2551",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
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
