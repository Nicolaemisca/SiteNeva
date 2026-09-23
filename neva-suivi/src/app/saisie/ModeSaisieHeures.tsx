"use client";

import { useState, type CSSProperties } from "react";
import { couleurs, styleChamp, TAILLE_TACTILE_MIN } from "@/lib/ui";
import { dictionnaires, type Langue } from "@/lib/i18n/dictionnaires";

// Presets de saisie rapide (cahier : priorité absolue à la rapidité sur
// téléphone) — couvrent les durées les plus fréquentes, le clavier numérique
// reste disponible pour affiner. Chiffres seuls : pas de texte à traduire.
const PRESETS = [8, 9, 10, 11];

// Une valeur initiale (suggestion basée sur d'anciennes saisies, ou
// republication après erreur) peut tomber hors grille — les saisies faites
// avant ce changement n'étaient pas au quart d'heure près. On arrondit une
// fois à l'initialisation plutôt que de laisser le select sans option
// sélectionnée : une valeur approchée reste plus utile qu'un champ vide.
function arrondirQuartHeure(hhmm: string): string {
  if (!hhmm) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const totalArrondi = Math.round((h * 60 + m) / 15) * 15;
  const hArrondi = Math.floor(totalArrondi / 60) % 24;
  const mArrondi = totalArrondi % 60;
  return `${String(hArrondi).padStart(2, "0")}:${String(mArrondi).padStart(2, "0")}`;
}

// step="900" sur <input type="time"> ne restreint pas fiablement la liste de
// minutes affichée par le picker natif desktop (confirmé en test : Chrome
// laisse toujours défiler 00 à 59) — seuls certains pickers mobiles
// respectent le pas. Pour vraiment n'offrir que :00/:15/:30/:45, deux
// <select> (heure, quart d'heure) réunis dans un seul cadre visuel donnent
// l'apparence d'un champ unique tout en garantissant la restriction, quel
// que soit le navigateur.
const HEURES = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const QUARTS_HEURE = ["00", "15", "30", "45"];

function heurePart(hhmm: string): string {
  return hhmm.split(":")[0] ?? "";
}

function minutePart(hhmm: string): string {
  return hhmm.split(":")[1] ?? "";
}

const styleSegmentHeure: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: "1.1rem",
  color: couleurs.texte,
  padding: "0.85rem 0.15rem",
  WebkitUserSelect: "text",
  userSelect: "text",
};

// Un seul cadre (styleChamp) autour de deux <select> natifs séparés par
// ":" : au clavier/tap, chacun ouvre sa propre liste — celle des minutes ne
// contient que les quatre valeurs autorisées, ce qu'un <input type="time">
// ne peut pas garantir (voir commentaire plus haut).
function ChampHeureQuartHeure({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: "0.25rem", flex: 1 }}>
      <span style={{ fontSize: "0.8rem", color: couleurs.texteAttenue }}>{label}</span>
      <div style={{ ...styleChamp, display: "flex", alignItems: "center", padding: "0 0.4rem" }}>
        <select
          aria-label={`${label} — heure`}
          required
          value={heurePart(value)}
          onChange={(e) => onChange(`${e.target.value}:${minutePart(value) || "00"}`)}
          style={{ ...styleSegmentHeure, flex: 1 }}
        >
          <option value="" disabled>
            --
          </option>
          {HEURES.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span aria-hidden style={{ color: couleurs.texteAttenue }}>
          :
        </span>
        <select
          aria-label={`${label} — minutes`}
          required
          value={minutePart(value)}
          onChange={(e) => onChange(`${heurePart(value) || "00"}:${e.target.value}`)}
          style={{ ...styleSegmentHeure, flex: 1 }}
        >
          <option value="" disabled>
            --
          </option>
          {QUARTS_HEURE.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" name={name} value={value} />
    </label>
  );
}

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
  langue,
}: {
  modeInitial: "total" | "horaires";
  valeurInitiale: string;
  debutInitial: string;
  finInitial: string;
  pauseInitiale: string;
  langue: Langue;
}) {
  const t = dictionnaires[langue];

  // Menu déroulant à valeurs prédéfinies (cahier consigne 6), pas un champ
  // libre : la pause de midi se décline en quelques durées usuelles, pas en
  // minutes arbitraires.
  const optionsPause = [
    { minutes: 0, libelle: t.modeHeures.pauseAucune },
    { minutes: 15, libelle: t.modeHeures.pause15 },
    { minutes: 30, libelle: t.modeHeures.pause30 },
    { minutes: 45, libelle: t.modeHeures.pause45 },
    { minutes: 60, libelle: t.modeHeures.pause1h },
    { minutes: 90, libelle: t.modeHeures.pause1h30 },
  ];

  const [mode, setMode] = useState<"total" | "horaires">(modeInitial);
  const [valeur, setValeur] = useState(valeurInitiale || "8");
  const [debut, setDebut] = useState(() => arrondirQuartHeure(debutInitial));
  const [fin, setFin] = useState(() => arrondirQuartHeure(finInitial));
  const [pause, setPause] = useState(pauseInitiale || "0");

  const heuresCalculees = calculerHeures(debut, fin, Number(pause));

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" onClick={() => setMode("total")} style={styleBoutonMode(mode === "total")}>
          {t.modeHeures.totalDirect}
        </button>
        <button type="button" onClick={() => setMode("horaires")} style={styleBoutonMode(mode === "horaires")}>
          {t.modeHeures.debutFin}
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
            <ChampHeureQuartHeure label={t.modeHeures.debut} name="heure_debut" value={debut} onChange={setDebut} />
            <ChampHeureQuartHeure label={t.modeHeures.fin} name="heure_fin" value={fin} onChange={setFin} />
          </div>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: couleurs.texteAttenue }}>{t.modeHeures.pause}</span>
            <select name="pause_minutes" value={pause} onChange={(e) => setPause(e.target.value)} style={styleChamp}>
              {optionsPause.map((o) => (
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
            {heuresCalculees != null
              ? `${t.modeHeures.total} : ${heuresCalculees.toFixed(2)} h`
              : t.modeHeures.renseigneDebutFin}
          </p>
        </div>
      )}
    </div>
  );
}
