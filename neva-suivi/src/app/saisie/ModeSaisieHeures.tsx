"use client";

import { useState, type CSSProperties } from "react";
import { couleurs, styleChamp, TAILLE_TACTILE_MIN } from "@/lib/ui";

// Presets de saisie rapide (cahier : priorité absolue à la rapidité sur
// téléphone) — couvrent les durées les plus fréquentes, le clavier numérique
// reste disponible pour affiner.
const PRESETS = [8, 9, 10, 11];

// Menu déroulant à valeurs prédéfinies (cahier consigne 6), pas un champ
// libre : la pause de midi se décline en quelques durées usuelles, pas en
// minutes arbitraires.
const OPTIONS_PAUSE = [
  { minutes: 0, libelle: "Aucune" },
  { minutes: 15, libelle: "15 min" },
  { minutes: 30, libelle: "30 min" },
  { minutes: 45, libelle: "45 min" },
  { minutes: 60, libelle: "1 h" },
  { minutes: 90, libelle: "1 h 30" },
];

const styleBoutonMode = (actif: boolean): CSSProperties => ({
  flex: 1,
  minHeight: 40,
  fontSize: "0.85rem",
  fontWeight: 600,
  borderRadius: 8,
  border: actif ? `2px solid ${couleurs.primaire}` : `1.5px solid ${couleurs.bordure}`,
  background: actif ? "#eaf1f8" : couleurs.fond,
  color: couleurs.texte,
});

// Le serveur recalcule et valide toujours ce total à partir de
// heure_debut/heure_fin/pause_minutes (src/app/actions/saisies.ts) — jamais
// confiance dans une valeur calculée côté client. Cet affichage n'est qu'un
// retour immédiat pour l'utilisateur pendant la saisie.
function calculerHeures(debut: string, fin: string, pauseMinutes: number): number | null {
  if (!debut || !fin) return null;
  const [hD, mD] = debut.split(":").map(Number);
  const [hF, mF] = fin.split(":").map(Number);
  const minutes = hF * 60 + mF - (hD * 60 + mD) - pauseMinutes;
  if (!(minutes > 0)) return null;
  return Math.round((minutes / 60) * 100) / 100;
}

export function ModeSaisieHeures({
  modeInitial,
  valeurInitiale,
  debutInitial,
  finInitial,
  pauseInitiale,
}: {
  modeInitial: "total" | "horaires";
  valeurInitiale: string;
  debutInitial: string;
  finInitial: string;
  pauseInitiale: string;
}) {
  const [mode, setMode] = useState<"total" | "horaires">(modeInitial);
  const [valeur, setValeur] = useState(valeurInitiale || "8");
  const [debut, setDebut] = useState(debutInitial);
  const [fin, setFin] = useState(finInitial);
  const [pause, setPause] = useState(pauseInitiale || "0");

  const heuresCalculees = calculerHeures(debut, fin, Number(pause));

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" onClick={() => setMode("total")} style={styleBoutonMode(mode === "total")}>
          Total direct
        </button>
        <button type="button" onClick={() => setMode("horaires")} style={styleBoutonMode(mode === "horaires")}>
          Début / fin
        </button>
      </div>

      <input type="hidden" name="mode" value={mode} />

      {mode === "total" ? (
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
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <label style={{ display: "grid", gap: "0.25rem", flex: 1 }}>
              <span style={{ fontSize: "0.8rem", color: couleurs.texteAttenue }}>Début</span>
              <input
                name="heure_debut"
                type="time"
                required
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                style={styleChamp}
              />
            </label>
            <label style={{ display: "grid", gap: "0.25rem", flex: 1 }}>
              <span style={{ fontSize: "0.8rem", color: couleurs.texteAttenue }}>Fin</span>
              <input
                name="heure_fin"
                type="time"
                required
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                style={styleChamp}
              />
            </label>
          </div>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: couleurs.texteAttenue }}>Pause</span>
            <select name="pause_minutes" value={pause} onChange={(e) => setPause(e.target.value)} style={styleChamp}>
              {OPTIONS_PAUSE.map((o) => (
                <option key={o.minutes} value={o.minutes}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </label>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              color: heuresCalculees != null ? couleurs.primaire : couleurs.texteAttenue,
            }}
          >
            {heuresCalculees != null ? `Total : ${heuresCalculees.toFixed(2)} h` : "Renseigne le début et la fin"}
          </p>
        </div>
      )}
    </div>
  );
}
