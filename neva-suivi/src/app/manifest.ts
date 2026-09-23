import type { MetadataRoute } from "next";
import { couleurs } from "@/lib/ui";

// Icône d'écran d'accueil : src/app/icon.png et apple-icon.png couvrent déjà
// le favicon et le "add to home screen" iOS via les conventions Next.js
// (aucune config requise pour ceux-là). Ce manifest couvre Android/Chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Neva Energy — Suivi chantier",
    short_name: "Neva Energy",
    description: "Suivi des heures et de l'avancement chantier — Neva Energy.",
    start_url: "/saisie",
    display: "standalone",
    background_color: couleurs.fondPage,
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
