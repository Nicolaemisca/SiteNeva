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
  // Fond de page (derrière les cartes/champs, qui eux restent en `fond`
  // blanc pour se détacher) : un gris très clair plutôt qu'un blanc pur,
  // moins agressif à l'œil en plein soleil sur chantier.
  fondPage: "#eef0f2",
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
  // Le <body> désactive la sélection de texte globalement (layout.tsx) :
  // la réactiver ici pour que tous les champs restent éditables/sélectionnables.
  WebkitUserSelect: "text",
  userSelect: "text",
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

// Palette catégorielle (identité par utilisateur, ex. calendrier de
// présence consigne 16) : ordre et valeurs issus de la palette de référence
// validée (CVD Delta E >= 8, contraste AA sur fond clair) — ne pas réordonner
// ni ajouter une couleur "à l'œil", l'ordre fait partie de la validation.
export const PALETTE_CATEGORIELLE = [
  "#2a78d6", // bleu
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // jaune
  "#e87ba4", // magenta
  "#008300", // vert
  "#4a3aa7", // violet
  "#e34948", // rouge
] as const;

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
