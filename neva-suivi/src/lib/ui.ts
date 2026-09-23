import type { CSSProperties } from "react";

// Identité visuelle Neva Energy — palette "bleu vif + corail" (choisie par
// le client pour aller plus loin que le navy/vert d'origine, extrait du
// logo). Le navy du logo reste utilisé ailleurs (Logo.tsx, favicon,
// themeColor) ; cette palette gouverne l'interface elle-même.
// Objectif cahier inchangé : sobre, très contrasté (lisible en plein soleil
// sur chantier), zones tactiles généreuses.
export const couleurs = {
  texte: "#14161a",
  texteAttenue: "#40454c",
  fond: "#ffffff",
  // Fond de page (derrière les cartes/champs, qui eux restent en `fond`
  // blanc pour se détacher) : un gris légèrement bleuté pour accompagner le
  // bleu vif plutôt qu'un gris neutre qui le ferait jurer.
  fondPage: "#eef1f7",
  primaire: "#2a5fd6",
  // Pôle sombre du dégradé de marque (boutons, en-têtes) — jamais utilisée
  // seule comme couleur de texte, uniquement en dégradé avec `primaire`.
  primaireProfond: "#15275f",
  primaireTexte: "#ffffff",
  // Corail : deux variantes délibérément différentes. `accent` (vif) sert de
  // fond/liseré décoratif ; sur blanc il ne contraste qu'à ~2.8:1, donc
  // jamais comme texte. `accentTexte` (assombri, ~5:1 sur blanc) porte le
  // même corail partout où il faut du texte ou un contour lisible
  // (bouton secondaire, liens) — un seul assombrissement calculé une fois
  // ici plutôt que deux teintes choisies "à l'œil" qui dériveraient.
  accent: "#ff6b57",
  accentTexte: "#c73f2e",
  accentFond: "#fff1ee",
  bordure: "#8f96a1",
  // Séparateur discret (cartes, entêtes de section) : plus doux que
  // `bordure`, qui reste réservée aux contours de champs/actions.
  bordureDouce: "#e1e4e8",
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

export const rayon = {
  petit: 8,
  // Dédié aux boutons (demande explicite : "rectangle arrondi, coins 12px"),
  // distinct de `moyen` (cartes) pour que les deux puissent évoluer
  // indépendamment.
  bouton: 12,
  moyen: 14,
  grand: 20,
} as const;

// Ombres teintées navy (pas un gris neutre générique) à faible opacité :
// lisibles en plein soleil sans jamais paraître sales ou salissantes sur
// fond clair.
export const ombre = {
  legere: "0 1px 2px rgba(12, 37, 81, 0.08)",
  moyenne: "0 8px 20px -6px rgba(12, 37, 81, 0.18)",
  boutonPrimaire: "0 6px 16px -4px rgba(21, 39, 95, 0.4)",
  // Ombre réduite pour l'état "pressé" (globals.css) : simule le bouton qui
  // s'enfonce dans la surface plutôt que de simplement s'assombrir.
  boutonPresse: "0 2px 6px -2px rgba(21, 39, 95, 0.35)",
} as const;

// Carte générique (sections du tableau de bord, blocs de formulaire) :
// centralisée ici pour que tout le monde ait la même élévation plutôt que
// des bordures plates ad hoc page par page.
export const styleCarte: CSSProperties = {
  background: couleurs.fond,
  border: `1px solid ${couleurs.bordureDouce}`,
  borderRadius: rayon.moyen,
  boxShadow: ombre.moyenne,
};

export const styleChamp: CSSProperties = {
  fontSize: "1.1rem",
  padding: "0.85rem",
  minHeight: TAILLE_TACTILE_MIN,
  borderRadius: rayon.petit,
  border: `1.5px solid ${couleurs.bordure}`,
  color: couleurs.texte,
  background: couleurs.fond,
  width: "100%",
  // Le <body> désactive la sélection de texte globalement (layout.tsx) :
  // la réactiver ici pour que tous les champs restent éditables/sélectionnables.
  WebkitUserSelect: "text",
  userSelect: "text",
};

// Rectangle arrondi (12px) plutôt qu'une pilule : reste net et "pro" plutôt
// qu'un style tout-arrondi. Dégradé bleu vif -> bleu profond + ombre
// marquée pour un effet de relief "pressable" (globals.css gère
// l'enfoncement au clic via boutonPresse).
export const styleBoutonPrimaire: CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 700,
  padding: "1rem",
  minHeight: 52,
  borderRadius: rayon.bouton,
  border: "none",
  background: `linear-gradient(155deg, ${couleurs.primaire}, ${couleurs.primaireProfond})`,
  color: couleurs.primaireTexte,
  boxShadow: ombre.boutonPrimaire,
};

// Contour + texte corail (accentTexte, pas accent — voir plus haut) : les
// actions secondaires se distinguent maintenant par la couleur, pas
// seulement par le remplissage, sans jamais tomber sous 4.5:1 sur blanc.
export const styleBoutonSecondaire: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  padding: "0.75rem 1.1rem",
  minHeight: TAILLE_TACTILE_MIN,
  borderRadius: rayon.bouton,
  border: `1.5px solid ${couleurs.accentTexte}`,
  background: couleurs.fond,
  color: couleurs.accentTexte,
  boxShadow: ombre.legere,
};

// Palette catégorielle (identité par utilisateur, ex. calendrier de
// présence consigne 16) : ordre et valeurs issus de la palette de référence
// validée (CVD Delta E >= 8, contraste AA sur fond clair) — ne pas réordonner
// ni ajouter une couleur "à l'œil", l'ordre fait partie de la validation.
// Volontairement laissée telle quelle malgré le changement de `primaire` :
// c'est une palette d'identité de données, pas une couleur de marque.
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
