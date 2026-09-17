"use client";

import { useState } from "react";
import { couleurs, styleChamp, TAILLE_TACTILE_MIN } from "@/lib/ui";

// Presets de saisie rapide (cahier : priorité absolue à la rapidité sur
// téléphone) — couvrent les durées les plus fréquentes, le clavier numérique
// reste disponible pour affiner.
const PRESETS = [8, 9, 10, 11];

export function ChampHeures({ valeurInitiale }: { valeurInitiale: string }) {
  const [valeur, setValeur] = useState(valeurInitiale || "8");

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {PRESETS.map((preset) => {
          const selectionne = valeur === String(preset);
          return (
            <button
              key={preset}
              type="button"
              onClick={() => setValeur(String(preset))}
              style={{
                flex: "1 1 3.5rem",
                minHeight: TAILLE_TACTILE_MIN,
                fontSize: "1.05rem",
                fontWeight: 600,
                borderRadius: 8,
                border: selectionne ? `2px solid ${couleurs.primaire}` : `1.5px solid ${couleurs.bordure}`,
                background: selectionne ? couleurs.primaire : couleurs.fond,
                color: selectionne ? couleurs.primaireTexte : couleurs.texte,
              }}
            >
              {preset}h
            </button>
          );
        })}
      </div>
      <input
        name="heures"
        type="number"
        inputMode="decimal"
        step="0.25"
        min="0.25"
        max="24"
        required
        aria-labelledby="etiquette-heures"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        style={styleChamp}
      />
    </div>
  );
}
