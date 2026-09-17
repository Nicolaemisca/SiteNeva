import type { CSSProperties } from "react";

// Identité visuelle Neva Energy — couleurs extraites directement du logo
// (public/logo.png : navy #0c2551, vert #019f76) plutôt qu'inventées.
// Objectif cahier : sobre, très contrasté (lisible en plein soleil sur
// chantier), zones tactiles généreuses.
//
// Le vert de marque (#019f76) ne contraste qu'à ~3.4:1 sur blanc — sous le
// seuil AA de 4.5:1 pour du texte courant. Il reste réservé aux accents
// décoratifs (le logo lui-même, une puce visuelle) ; jamais comme couleur de
// texte ou de fond de bouton avec texte dessus.
export const couleurs = {
  texte: "#14161a",
  texteAttenue: "#40454c",
  fond: "#ffffff",
  primaire: "#0c2551",
  primaireTexte: "#ffffff",
  accentVert: "#019f76",
  bordure: "#8f96a1",
  erreur: "#b3001b",
  erreurFond: "#fdecee",
  succes: "#0a7a3d",
  succesFond: "#e9f7ee",
  avertissement: "#8a5a00",
  avertissementFond: "#fff4dc",
} as const;

// Zones tactiles généreuses (cahier) : 48px dépasse le minimum usuel
// (44pt iOS / 48dp Android pris à la lettre), pour rester utilisable avec
// des gants ou des doigts mouillés sur chantier.
export const TAILLE_TACTILE_MIN = 48;

export const styleChamp: CSSProperties = {
  fontSize: "1.1rem",
  padding: "0.85rem",
  minHeight: TAILLE_TACTILE_MIN,
  borderRadius: 8,
  border: `1.5px solid ${couleurs.bordure}`,
  color: couleurs.texte,
  background: couleurs.fond,
  width: "100%",
};

export const styleBoutonPrimaire: CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 700,
  padding: "1rem",
  minHeight: 52,
  borderRadius: 8,
  border: "none",
  background: couleurs.primaire,
  color: couleurs.primaireTexte,
};

export const styleBoutonSecondaire: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  padding: "0.75rem 1.1rem",
  minHeight: TAILLE_TACTILE_MIN,
  borderRadius: 8,
  border: `1.5px solid ${couleurs.primaire}`,
  background: couleurs.fond,
  color: couleurs.primaire,
};
