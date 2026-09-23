export type PointageBrut = {
  chantierId: string;
  chantierNom: string;
  horodatage: string; // ISO, tri croissant attendu
};

export type LigneRecapPointage = {
  chantierId: string;
  chantierNom: string;
  heures: number;
};

// Calcule la durée passée sur chaque chantier à partir d'une suite de
// pointages d'arrivée (cahier consigne 15 : "calcule automatiquement ... à
// partir des pointages successifs"). Chaque pointage clôt implicitement le
// précédent ; `cloture` (heure de fin de journée choisie par l'admin) clôt
// le dernier. Fonction pure, réutilisée telle quelle par l'aperçu (page
// recap) et par l'enregistrement (action cloturerPointage) : le serveur ne
// fait jamais confiance à un total recalculé côté client, seule l'heure de
// clôture transite (cf. src/app/actions/saisies.ts, même principe).
export function calculerRecapPointage(pointages: PointageBrut[], cloture: Date): LigneRecapPointage[] {
  const totaux = new Map<string, { nom: string; minutes: number }>();

  for (let i = 0; i < pointages.length; i++) {
    const courant = pointages[i];
    const debut = new Date(courant.horodatage).getTime();
    const fin = i + 1 < pointages.length ? new Date(pointages[i + 1].horodatage).getTime() : cloture.getTime();
    const minutes = (fin - debut) / 60_000;

    if (!(minutes > 0)) continue;

    const existant = totaux.get(courant.chantierId);
    totaux.set(courant.chantierId, {
      nom: courant.chantierNom,
      minutes: (existant?.minutes ?? 0) + minutes,
    });
  }

  return [...totaux.entries()]
    .map(([chantierId, { nom, minutes }]) => ({
      chantierId,
      chantierNom: nom,
      heures: Math.round((minutes / 60) * 100) / 100,
    }))
    .filter((ligne) => ligne.heures > 0 && ligne.heures <= 24);
}
