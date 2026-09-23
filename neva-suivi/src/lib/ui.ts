import type { CSSProperties } from "react";

// Identité visuelle Neva Energy — vision "chantier industriel haute
// visibilité" (demandée par le client comme refonte complète, en rupture
// avec les versions précédentes bleu/corail à ombres douces) : noir + ambre
// sécurité, blocs plats, bordures franches, aucune ombre ni dégradé. Objectif
// cahier inchangé, et ici pris au pied de la lettre : sobre, très contrasté
// (lisible en plein soleil sur chantier), zones tactiles généreuses — le
// noir/ambre est littéralement la palette de la signalétique de chantier.
export const couleurs = {
  texte: "#0a0a0a",
  texteAttenue: "#3a3a3a",
  fond: "#ffffff",
  // Gris chaud très clair, pas un blanc pur ni un gris froid : accompagne
  // l'ambre sans l'affadir.
  fondPage: "#f2f1ec",
  primaire: "#f5a300",
  // Ambre plus sombre : hover/press (inversion simple, pas d'ombre), jamais
  // comme couleur de texte.
  primaireProfond: "#c98400",
  // Texte NOIR sur fond ambre, pas blanc : c'est le principe même de la
  // signalétique haute visibilité (contraste max, jamais l'inverse).
  primaireTexte: "#0a0a0a",
  // Le noir est l'accent structurel de ce thème (bordures, liserés, bandes)
  // — remplace le corail des versions précédentes.
  accent: "#0a0a0a",
  accentTexte: "#0a0a0a",
  accentFond: "#fff4dc",
  // Bordures franches, toutes noires : c'est la signature visuelle de ce
  // thème, pas une bordure "douce" nuancée par endroit (cf. bordureDouce
  // plus bas, gardée identique à `bordure` pour ne rien laisser de gris
  // discret se glisser dans un thème qui se veut net partout).
  bordure: "#0a0a0a",
  bordureDouce: "#0a0a0a",
  erreur: "#c1121f",
  erreurFond: "#fde8e8",
  succes: "#0a7a3d",
  succesFond: "#e9f7ee",
  // Même ambre que `primaire` : cohérent avec la signalétique hazard, où
  // "avertissement" et "action" partagent la même couleur.
  avertissement: "#a86b00",
  avertissementFond: "#fff4dc",
} as const;

// Zones tactiles généreuses (cahier) : 48px dépasse le minimum usuel
// (44pt iOS / 48dp Android pris à la lettre), pour rester utilisable avec
// des gants ou des doigts mouillés sur chantier.
export const TAILLE_TACTILE_MIN = 48;

// Coins presque droits (2-4px, jamais arrondis) : c'est le contraire des
// versions précédentes, volontairement — la netteté fait partie de la
// vision "signalétique chantier", pas un oubli.
export const rayon = {
  petit: 2,
  bouton: 2,
  moyen: 3,
  grand: 4,
} as const;

// Aucune ombre dans ce thème (demande explicite : "aucune ombre, aucun
// dégradé, tout est plat et net"). Les tokens restent définis à "none"
// plutôt que supprimés : tout le code existant qui les référence
// (styleCarte, boutons, en-têtes) devient plat automatiquement, sans avoir
// à toucher chaque fichier un par un.
export const ombre = {
  legere: "none",
  moyenne: "none",
  boutonPrimaire: "none",
  boutonPresse: "none",
} as const;

// Carte générique : bordure noire franche, coins presque droits, aucune
// ombre — le relief vient de la bordure épaisse, pas d'une élévation.
export const styleCarte: CSSProperties = {
  background: couleurs.fond,
  border: `2.5px solid ${couleurs.bordureDouce}`,
  borderRadius: rayon.moyen,
  boxShadow: ombre.moyenne,
};

export const styleChamp: CSSProperties = {
  fontSize: "1.1rem",
  padding: "0.85rem",
  minHeight: TAILLE_TACTILE_MIN,
  borderRadius: rayon.petit,
  border: `2px solid ${couleurs.bordure}`,
  color: couleurs.texte,
  background: couleurs.fond,
  width: "100%",
  // Le <body> désactive la sélection de texte globalement (layout.tsx) :
  // la réactiver ici pour que tous les champs restent éditables/sélectionnables.
  WebkitUserSelect: "text",
  userSelect: "text",
};

// Bloc ambre plein, texte noir, bordure noire épaisse — pas de dégradé, pas
// d'ombre : la troisième dimension vient uniquement de la bordure, comme un
// panneau de signalisation. Majuscules + Oswald (via fontFamily) pour l'effet
// "signalétique" (cf. layout.tsx pour le chargement de la police).
export const styleBoutonPrimaire: CSSProperties = {
  fontFamily: "var(--font-display), sans-serif",
  fontSize: "1.1rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  padding: "1rem",
  minHeight: 52,
  borderRadius: rayon.bouton,
  border: `3px solid ${couleurs.texte}`,
  background: couleurs.primaire,
  color: couleurs.primaireTexte,
  boxShadow: ombre.boutonPrimaire,
};

// Même famille (bordure noire épaisse, coins presque droits), fond blanc
// au lieu d'ambre : la hiérarchie action principale/secondaire vient du
// remplissage, pas de la couleur de bordure (toujours noire dans ce thème).
export const styleBoutonSecondaire: CSSProperties = {
  fontFamily: "var(--font-display), sans-serif",
  fontSize: "0.95rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  padding: "0.75rem 1.1rem",
  minHeight: TAILLE_TACTILE_MIN,
  borderRadius: rayon.bouton,
  border: `2.5px solid ${couleurs.accentTexte}`,
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
