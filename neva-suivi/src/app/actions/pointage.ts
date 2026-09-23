"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { dateDuJourBelge } from "@/lib/date";
import { calculerRecapPointage, type PointageBrut } from "@/lib/recapPointage";

function nombreOuNull(valeur: string): number | null {
  if (!valeur) return null;
  const n = Number(valeur);
  return Number.isFinite(n) ? n : null;
}

// Enregistre une arrivée : heure serveur (horodatage, colonne par défaut) +
// position transmise par le client (capturée juste avant l'appel, cf.
// BoutonArrivee). Le GPS reste indicatif et jamais bloquant (cahier §7) : un
// refus ou un échec de géolocalisation n'empêche pas le pointage.
export async function enregistrerArrivee(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const chantierId = String(formData.get("chantier_id") ?? "");
  if (!chantierId) {
    redirect("/pointage?erreur=" + encodeURIComponent("Choisis un chantier avant de pointer."));
  }

  const latitude = nombreOuNull(String(formData.get("latitude") ?? ""));
  const longitude = nombreOuNull(String(formData.get("longitude") ?? ""));
  const precisionMetres = nombreOuNull(String(formData.get("precision_metres") ?? ""));

  const { error } = await supabase.from("pointages").insert({
    user_id: user.id,
    chantier_id: chantierId,
    latitude,
    longitude,
    precision_metres: precisionMetres,
  });

  if (error) {
    redirect("/pointage?erreur=" + encodeURIComponent(error.message));
  }

  revalidatePath("/pointage");
  redirect("/pointage?enregistre=1");
}

// Supprime un pointage du jour (faux tap, mauvais chantier choisi) : pas de
// confirmation en deux temps ici contrairement aux saisies/chantiers — c'est
// un brouillon de calcul du jour même, pas une donnée facturée (cahier
// consigne 15 vs. consignes 9/10).
export async function supprimerPointage(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/pointage");
  }

  await supabase.from("pointages").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/pointage");
  redirect("/pointage?supprime=1");
}

// Clôture la journée : relit les pointages du jour depuis la base (jamais le
// total affiché côté client), recalcule les durées avec la même heure de
// clôture que celle montrée sur l'aperçu (transmise en champ caché depuis
// /pointage/recap, pour que l'aperçu et l'enregistrement portent exactement
// sur le même calcul), crée une saisie par chantier, puis vide les pointages
// du jour — consommés, ils n'ont plus d'utilité propre une fois matérialisés
// en saisies (cahier consigne 15 : "propose un récapitulatif à vérifier
// avant enregistrement").
export async function cloturerPointage(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const date = dateDuJourBelge();
  const cloture = new Date(String(formData.get("cloture") ?? ""));

  if (Number.isNaN(cloture.getTime())) {
    redirect("/pointage?erreur=" + encodeURIComponent("Clôture invalide, réessaie."));
  }

  const { data: pointages, error: erreurLecture } = await supabase
    .from("pointages")
    .select("chantier_id, horodatage, chantiers(nom)")
    .eq("user_id", user.id)
    .eq("date", date)
    .order("horodatage", { ascending: true });

  if (erreurLecture || !pointages || pointages.length === 0) {
    redirect("/pointage?erreur=" + encodeURIComponent("Aucun pointage à clôturer aujourd'hui."));
  }

  const brut: PointageBrut[] = pointages.map((p) => ({
    chantierId: p.chantier_id as string,
    chantierNom: (p.chantiers as unknown as { nom: string } | null)?.nom ?? "",
    horodatage: p.horodatage as string,
  }));

  const recap = calculerRecapPointage(brut, cloture);

  if (recap.length === 0) {
    redirect("/pointage?erreur=" + encodeURIComponent("Durée nulle sur tous les chantiers, rien à enregistrer."));
  }

  const { error: erreurInsertion } = await supabase.from("saisies").insert(
    recap.map((ligne) => ({
      user_id: user.id,
      chantier_id: ligne.chantierId,
      date,
      heures: ligne.heures,
      description: "Généré automatiquement depuis le pointage (consigne 15).",
    }))
  );

  if (erreurInsertion) {
    redirect("/pointage/recap?erreur=" + encodeURIComponent(erreurInsertion.message));
  }

  await supabase.from("pointages").delete().eq("user_id", user.id).eq("date", date);

  revalidatePath("/pointage");
  revalidatePath("/saisie");
  revalidatePath("/historique");
  redirect("/pointage?journee_cloturee=1");
}
