// Multilingue français/roumain (cahier consigne 8) — écrans technicien
// uniquement (saisie, historique, profil) ; le back-office admin reste
// toujours en français, ces pages n'importent jamais ce fichier.
//
// ⚠️ Traductions roumaines rédigées sans relecteur natif disponible dans
// cette session. Le vocabulaire de chantier ne s'invente pas (cahier) : à
// faire relire par un associé roumanophone avant de considérer ce texte
// comme définitif, en particulier les termes techniques (échafaudage,
// matériel, chantier...).
//
// Une seule interface Dictionnaire pour les deux langues : le compilateur
// signale toute clé manquante des deux côtés, aucune traduction ne peut
// être oubliée silencieusement.

export type Langue = "fr" | "ro";

export const LANGUES: { valeur: Langue; libelle: string }[] = [
  { valeur: "fr", libelle: "Français" },
  { valeur: "ro", libelle: "Română" },
];

export interface Dictionnaire {
  nav: {
    saisie: string;
    historique: string;
    backOffice: string;
    profil: string;
    deconnexion: string;
  };
  champs: {
    date: string;
    chantier: string;
    heures: string;
    description: string;
    materiel: string;
    choisirUnChantier: string;
  };
  modeHeures: {
    totalDirect: string;
    debutFin: string;
    debut: string;
    fin: string;
    pause: string;
    pauseAucune: string;
    pause15: string;
    pause30: string;
    pause45: string;
    pause1h: string;
    pause1h30: string;
    renseigneDebutFin: string;
    total: string; // interpolé : `${t.modeHeures.total} : X h`
  };
  boutons: {
    enregistrer: string;
    enregistrement: string;
    enregistrerCorrection: string;
    confirmerQuandMeme: string;
    envoi: string;
    annuler: string;
  };
  saisiePage: {
    titre: string;
    saisieEnregistree: string;
    doublonMessage: string;
    erreurChargementChantiers: string;
    suggestionIntro: string;
    suggestionSuffixe: string;
  };
  historiquePage: {
    titre: string;
    moisPrecedent: string;
    moisSuivant: string;
    saisieModifiee: string;
    erreurChargement: string;
    totalDuMois: string;
    aucuneSaisie: string;
    materielPrefixe: string;
    modifiableCorriger: string;
    corrigerTitre: string;
  };
  erreursSaisie: {
    horairesRequis: string;
    finAvantDebut: string;
    heuresRequises: string;
    dateChantierRequis: string;
    correctionRefusee: string;
  };
  profilPage: {
    titre: string;
    nom: string;
    email: string;
    role: string;
    roleTechnicien: string;
    roleAdmin: string;
    langue: string;
    langueEnregistree: string;
    erreurEnregistrement: string;
    enregistrer: string;
  };
}

const fr: Dictionnaire = {
  nav: {
    saisie: "Saisie",
    historique: "Historique",
    backOffice: "Back-office",
    profil: "Profil",
    deconnexion: "Déconnexion",
  },
  champs: {
    date: "Date",
    chantier: "Chantier",
    heures: "Heures",
    description: "Description (optionnel)",
    materiel: "Matériel utilisé (optionnel)",
    choisirUnChantier: "Choisir un chantier",
  },
  modeHeures: {
    totalDirect: "Total direct",
    debutFin: "Début / fin",
    debut: "Début",
    fin: "Fin",
    pause: "Pause",
    pauseAucune: "Aucune",
    pause15: "15 min",
    pause30: "30 min",
    pause45: "45 min",
    pause1h: "1 h",
    pause1h30: "1 h 30",
    renseigneDebutFin: "Renseigne le début et la fin",
    total: "Total",
  },
  boutons: {
    enregistrer: "Enregistrer",
    enregistrement: "Enregistrement…",
    enregistrerCorrection: "Enregistrer la correction",
    confirmerQuandMeme: "Confirmer quand même",
    envoi: "Envoi…",
    annuler: "Annuler",
  },
  saisiePage: {
    titre: "Saisie du jour",
    saisieEnregistree: "Saisie enregistrée.",
    doublonMessage: "Une saisie existe déjà pour ce chantier à cette date. Ajouter quand même ?",
    erreurChargementChantiers: "Impossible de charger les chantiers",
    suggestionIntro: "Suggestion d'après tes deux dernières semaines",
    suggestionSuffixe:
      "déjà rempli ci-dessous, modifie librement. Rien n'est enregistré tant que tu n'appuies pas sur « Enregistrer ».",
  },
  historiquePage: {
    titre: "Historique",
    moisPrecedent: "Mois précédent",
    moisSuivant: "Mois suivant",
    saisieModifiee: "Saisie modifiée.",
    erreurChargement: "Impossible de charger l'historique",
    totalDuMois: "Total du mois",
    aucuneSaisie: "Aucune saisie ce mois-ci.",
    materielPrefixe: "Matériel",
    modifiableCorriger: "Modifiable — corriger",
    corrigerTitre: "Corriger la saisie",
  },
  erreursSaisie: {
    horairesRequis: "Heure de début, heure de fin et pause sont requises.",
    finAvantDebut: "L'heure de fin doit être après le début (pause déduite), pour un total d'au plus 24 h.",
    heuresRequises: "Heures (entre 0 et 24) requises.",
    dateChantierRequis: "Date et chantier sont requis.",
    correctionRefusee: "Modification refusée : cette saisie n'est peut-être plus dans le délai de correction (7 jours).",
  },
  profilPage: {
    titre: "Profil",
    nom: "Nom",
    email: "Email",
    role: "Rôle",
    roleTechnicien: "Technicien",
    roleAdmin: "Admin",
    langue: "Langue de l'interface",
    langueEnregistree: "Langue mise à jour.",
    erreurEnregistrement: "La langue n'a pas pu être enregistrée.",
    enregistrer: "Enregistrer",
  },
};

const ro: Dictionnaire = {
  nav: {
    saisie: "Pontaj",
    historique: "Istoric",
    backOffice: "Administrare",
    profil: "Profil",
    deconnexion: "Deconectare",
  },
  champs: {
    date: "Data",
    chantier: "Șantier",
    heures: "Ore",
    description: "Descriere (opțional)",
    materiel: "Echipament folosit (opțional)",
    choisirUnChantier: "Alege un șantier",
  },
  modeHeures: {
    totalDirect: "Total direct",
    debutFin: "Început / sfârșit",
    debut: "Început",
    fin: "Sfârșit",
    pause: "Pauză",
    pauseAucune: "Fără",
    pause15: "15 min",
    pause30: "30 min",
    pause45: "45 min",
    pause1h: "1 h",
    pause1h30: "1 h 30",
    renseigneDebutFin: "Completează începutul și sfârșitul",
    total: "Total",
  },
  boutons: {
    enregistrer: "Salvează",
    enregistrement: "Se salvează…",
    enregistrerCorrection: "Salvează corecția",
    confirmerQuandMeme: "Confirmă oricum",
    envoi: "Se trimite…",
    annuler: "Anulează",
  },
  saisiePage: {
    titre: "Pontajul zilei",
    saisieEnregistree: "Pontaj salvat.",
    doublonMessage: "Există deja o înregistrare pentru acest șantier la această dată. Adaugi oricum?",
    erreurChargementChantiers: "Șantierele nu au putut fi încărcate",
    suggestionIntro: "Sugestie pe baza ultimelor două săptămâni",
    suggestionSuffixe:
      "completat deja mai jos, poți modifica liber. Nimic nu se salvează până nu apeși pe „Salvează”.",
  },
  historiquePage: {
    titre: "Istoric",
    moisPrecedent: "Luna precedentă",
    moisSuivant: "Luna următoare",
    saisieModifiee: "Pontaj modificat.",
    erreurChargement: "Istoricul nu a putut fi încărcat",
    totalDuMois: "Total lunar",
    aucuneSaisie: "Nicio înregistrare luna aceasta.",
    materielPrefixe: "Echipament",
    modifiableCorriger: "Corectabil — corectează",
    corrigerTitre: "Corectează pontajul",
  },
  erreursSaisie: {
    horairesRequis: "Ora de început, ora de sfârșit și pauza sunt obligatorii.",
    finAvantDebut: "Ora de sfârșit trebuie să fie după cea de început (pauza deja scăzută), pentru un total de cel mult 24 de ore.",
    heuresRequises: "Orele (între 0 și 24) sunt obligatorii.",
    dateChantierRequis: "Data și șantierul sunt obligatorii.",
    correctionRefusee: "Modificare refuzată: această înregistrare nu mai este poate în perioada de corectare (7 zile).",
  },
  profilPage: {
    titre: "Profil",
    nom: "Nume",
    email: "Email",
    role: "Rol",
    roleTechnicien: "Tehnician",
    roleAdmin: "Admin",
    langue: "Limba interfeței",
    langueEnregistree: "Limbă actualizată.",
    erreurEnregistrement: "Limba nu a putut fi salvată.",
    enregistrer: "Salvează",
  },
};

export const dictionnaires: Record<Langue, Dictionnaire> = { fr, ro };

export function estLangueValide(valeur: unknown): valeur is Langue {
  return valeur === "fr" || valeur === "ro";
}
