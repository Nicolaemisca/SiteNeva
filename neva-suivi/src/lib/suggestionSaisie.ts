// Pré-remplissage intelligent (cahier consigne 5) : "proposer, jamais
// décider à leur place" — un chantier/nombre d'heures n'est jamais suggéré
// s'il n'est apparu qu'une fois sur les 14 derniers jours (ce n'est pas une
// habitude, juste un cas isolé). Samedi et semaine ne se mélangent jamais :
// un samedi ne doit être influencé que par d'autres samedis, et vice versa.
const SEUIL_MIN_OCCURRENCES = 2;

export type SaisieRecente = { date: string; chantier_id: string; heures: number | string };

export type SuggestionSaisie = {
  chantierId: string | null;
  heures: number | null;
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

  return {
    chantierId: valeurLaPlusFrequente(pertinentes.map((s) => s.chantier_id)),
    heures: valeurLaPlusFrequente(pertinentes.map((s) => Number(s.heures))),
  };
}
