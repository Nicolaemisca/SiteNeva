// Pré-remplissage intelligent (cahier consigne 5, étendu aux horaires par la
// consigne 6) : "proposer, jamais décider à leur place" — un chantier/
// nombre d'heures/horaire n'est jamais suggéré s'il n'est apparu qu'une fois
// sur les 14 derniers jours (ce n'est pas une habitude, juste un cas
// isolé). Samedi et semaine ne se mélangent jamais : un samedi ne doit être
// influencé que par d'autres samedis, et vice versa.
const SEUIL_MIN_OCCURRENCES = 2;

export type SaisieRecente = {
  date: string;
  chantier_id: string;
  heures: number | string;
  heure_debut: string | null;
  heure_fin: string | null;
  pause_minutes: number | null;
};

export type SuggestionSaisie = {
  chantierId: string | null;
  heures: number | null;
  // Non nul seulement si des saisies en mode "horaires" (au moins deux,
  // identiques) existent dans la fenêtre pertinente — sinon la saisie
  // repropose le mode total, plus rapide par défaut (cahier §2).
  horaires: { debut: string; fin: string; pauseMinutes: number } | null;
};

function estSamedi(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 6;
}

function valeurLaPlusFrequente<T extends string | number>(valeurs: T[]): T | null {
  if (valeurs.length === 0) return null;

  const compte = new Map<T, number>();
  for (const v of valeurs) compte.set(v, (compte.get(v) ?? 0) + 1);

  let meilleur: T | null = null;
  let max = 0;
  for (const [valeur, n] of compte) {
    if (n > max) {
      max = n;
      meilleur = valeur;
    }
  }

  return max >= SEUIL_MIN_OCCURRENCES ? meilleur : null;
}

export function calculerSuggestion(saisiesRecentes: SaisieRecente[], aujourdHui: string): SuggestionSaisie {
  const aujourdHuiEstSamedi = estSamedi(aujourdHui);
  const pertinentes = saisiesRecentes.filter((s) => estSamedi(s.date) === aujourdHuiEstSamedi);

  const chantierId = valeurLaPlusFrequente(pertinentes.map((s) => s.chantier_id));
  const heures = valeurLaPlusFrequente(pertinentes.map((s) => Number(s.heures)));

  // Début/fin/pause forment un seul horaire, pas trois valeurs
  // indépendantes (recombiner le début le plus fréquent avec une fin d'un
  // autre jour donnerait un horaire qui n'a jamais existé) : clé composite.
  // Postgres renvoie les colonnes time avec les secondes ("08:00:00") ;
  // tronqué à HH:MM pour l'affichage comme pour la saisie (<input
  // type="time">).
  const horairesRenseignes = pertinentes.filter(
    (s): s is SaisieRecente & { heure_debut: string; heure_fin: string; pause_minutes: number } =>
      s.heure_debut != null && s.heure_fin != null && s.pause_minutes != null
  );
  const cleHoraire = valeurLaPlusFrequente(
    horairesRenseignes.map((s) => `${s.heure_debut.slice(0, 5)}|${s.heure_fin.slice(0, 5)}|${s.pause_minutes}`)
  );

  let horaires: SuggestionSaisie["horaires"] = null;
  if (cleHoraire) {
    const [debut, fin, pauseMinutes] = cleHoraire.split("|");
    horaires = { debut, fin, pauseMinutes: Number(pauseMinutes) };
  }

  return { chantierId, heures, horaires };
}
