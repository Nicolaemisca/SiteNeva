import type { ReactNode } from "react";
import { couleurs, rayon } from "@/lib/ui";

type Variante = "succes" | "erreur" | "avertissement" | "info";

const ICONES: Record<Variante, string> = {
  succes: "✓",
  erreur: "✕",
  avertissement: "!",
  info: "i",
};

const TEINTES: Record<Variante, { texte: string; fond: string }> = {
  succes: { texte: couleurs.succes, fond: couleurs.succesFond },
  erreur: { texte: couleurs.erreur, fond: couleurs.erreurFond },
  avertissement: { texte: couleurs.avertissement, fond: couleurs.avertissementFond },
  info: { texte: couleurs.primaire, fond: "#eaf1f8" },
};

// Bandeau de message unifié (succès/erreur/avertissement/info) : remplace
// les <p style={{...}}> dupliqués sur chaque page avec une mise en forme
// légèrement différente. Pastille-icône + fondu d'entrée partout, pour que
// tout retour d'action se lise pareil dans toute l'appli.
export function Alerte({
  variante,
  role,
  children,
}: {
  variante: Variante;
  role?: "status" | "alert";
  children: ReactNode;
}) {
  const c = TEINTES[variante];

  return (
    <div
      className="apparition-douce"
      role={role ?? (variante === "erreur" ? "alert" : "status")}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.65rem",
        color: c.texte,
        background: c.fond,
        border: `1.5px solid ${c.texte}`,
        borderRadius: rayon.petit,
        padding: "0.85rem 1rem",
        fontWeight: 600,
        fontSize: "0.95rem",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: c.texte,
          color: "#fff",
          fontSize: "0.75rem",
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {ICONES[variante]}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}
