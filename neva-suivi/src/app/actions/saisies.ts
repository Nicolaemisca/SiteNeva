"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function versUrlSaisie(params: Record<string, string>): string {
  return `/saisie?${new URLSearchParams(params).toString()}`;
}

function versUrlModification(id: string, params: Record<string, string>): string {
  return `/historique/${id}?${new URLSearchParams(params).toString()}`;
}

type ChampsHeures =
  | { ok: true; heures: number; heureDebut: string | null; heureFin: string | null; pauseMinutes: number | null }
  | { ok: false; erreur: string };

// Deux modes coexistent (cahier consigne 6) : total direct, ou début/fin/
// pause dont le total est déduit. Le total est toujours recalculé ici côté
// serveur — jamais une valeur envoyée telle quelle par le client, même en
// mode horaires où le formulaire l'affiche déjà pour un retour immédiat.
function lireChampsHeures(formData: FormData): ChampsHeures {
  const mode = String(formData.get("mode") ?? "total");

  if (mode === "horaires") {
    const heureDebut = String(formData.get("heure_debut") ?? "");
    const heureFin = String(formData.get("heure_fin") ?? "");
    const pauseMinutes = Number(formData.get("pause_minutes") ?? "0");

    if (!heureDebut || !heureFin || Number.isNaN(pauseMinutes) || pauseMinutes < 0) {
      return { ok: false, erreur: "Heure de début, heure de fin et pause sont requises." };
    }

    const [hD, mD] = heureDebut.split(":").map(Number);
    const [hF, mF] = heureFin.split(":").map(Number);
    const minutes = hF * 60 + mF - (hD * 60 + mD) - pauseMinutes;
    const heures = Math.round((minutes / 60) * 100) / 100;

    if (!(heures > 0) || heures > 24) {
      return {
        ok: false,
        erreur: "L'heure de fin doit être après le début (pause déduite), pour un total d'au plus 24 h.",
      };
    }

    return { ok: true, heures, heureDebut, heureFin, pauseMinutes };
  }

  const heuresBrut = String(formData.get("heures") ?? "").trim().replace(",", ".");
  const heures = Number(heuresBrut);

  if (!heuresBrut || Number.isNaN(heures) || heures <= 0 || heures > 24) {
    return { ok: false, erreur: "Heures (entre 0 et 24) requises." };
  }

  return { ok: true, heures, heureDebut: null, heureFin: null, pauseMinutes: null };
}

// Conserve tous les champs du formulaire (y compris le détail horaire) pour
// republier exactement ce que l'utilisateur avait saisi en cas d'erreur ou
// de doublon — jamais juste le total, sinon un retour au mode horaires
// perdrait le détail déjà tapé.
function champsHorairesAConserver(formData: FormData): Record<string, string> {
  return {
    mode: String(formData.get("mode") ?? "total"),
    heures: String(formData.get("heures") ?? ""),
    heure_debut: String(formData.get("heure_debut") ?? ""),
    heure_fin: String(formData.get("heure_fin") ?? ""),
    pause_minutes: String(formData.get("pause_minutes") ?? ""),
  };
}

// Créé une saisie. Le doublon (même technicien/chantier/date) n'est jamais
// bloqué (cahier §7), seulement signalé : un premier appel sans
// confirmer_doublon s'arrête et renvoie vers un écran d'avertissement qui
// republie les mêmes champs ; les valider une seconde fois (confirmer_doublon
// = "1") force l'insertion.
export async function creerSaisie(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const date = String(formData.get("date") ?? "");
  const chantierId = String(formData.get("chantier_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const materiel = String(formData.get("materiel") ?? "").trim();
  const confirmerDoublon = formData.get("confirmer_doublon") === "1";

  const champsAConserver = {
    date,
    chantier_id: chantierId,
    description,
    materiel,
    ...champsHorairesAConserver(formData),
  };

  const champsHeures = lireChampsHeures(formData);

  if (!date || !chantierId || !champsHeures.ok) {
    redirect(
      versUrlSaisie({
        ...champsAConserver,
        erreur: !champsHeures.ok ? champsHeures.erreur : "Date et chantier sont requis.",
      })
    );
  }

  if (!confirmerDoublon) {
    const { data: existantes } = await supabase
      .from("saisies")
      .select("id")
      .eq("user_id", user.id)
      .eq("chantier_id", chantierId)
      .eq("date", date)
      .limit(1);

    if (existantes && existantes.length > 0) {
      redirect(versUrlSaisie({ ...champsAConserver, doublon: "1" }));
    }
  }

  const { error } = await supabase.from("saisies").insert({
    user_id: user.id,
    chantier_id: chantierId,
    date,
    heures: champsHeures.heures,
    heure_debut: champsHeures.heureDebut,
    heure_fin: champsHeures.heureFin,
    pause_minutes: champsHeures.pauseMinutes,
    description: description || null,
    materiel: materiel || null,
  });

  if (error) {
    redirect(versUrlSaisie({ ...champsAConserver, erreur: error.message }));
  }

  revalidatePath("/saisie");
  redirect("/saisie?envoye=1");
}

// Correction par le technicien lui-même (cahier consigne 4), bornée aux 7
// derniers jours — pas de contrôle applicatif de fenêtre ici : la policy
// RLS saisies_update_own_recent_or_admin (migration 0001) est déjà la
// source de vérité, y compris sur le nouveau champ date (with check). On se
// contente de détecter qu'elle a filtré la ligne (0 résultat) pour donner un
// message clair plutôt qu'un faux succès silencieux.
export async function modifierSaisie(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const chantierId = String(formData.get("chantier_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const materiel = String(formData.get("materiel") ?? "").trim();

  if (!id) {
    redirect("/historique");
  }

  const champsAConserver = {
    date,
    chantier_id: chantierId,
    description,
    materiel,
    ...champsHorairesAConserver(formData),
  };

  const champsHeures = lireChampsHeures(formData);

  if (!date || !chantierId || !champsHeures.ok) {
    redirect(
      versUrlModification(id, {
        ...champsAConserver,
        erreur: !champsHeures.ok ? champsHeures.erreur : "Date et chantier sont requis.",
      })
    );
  }

  const { data, error } = await supabase
    .from("saisies")
    .update({
      date,
      chantier_id: chantierId,
      heures: champsHeures.heures,
      heure_debut: champsHeures.heureDebut,
      heure_fin: champsHeures.heureFin,
      pause_minutes: champsHeures.pauseMinutes,
      description: description || null,
      materiel: materiel || null,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      versUrlModification(id, {
        ...champsAConserver,
        erreur: "Modification refusée : cette saisie n'est peut-être plus dans le délai de correction (7 jours).",
      })
    );
  }

  revalidatePath("/historique");
  redirect("/historique?modifie=1");
}
