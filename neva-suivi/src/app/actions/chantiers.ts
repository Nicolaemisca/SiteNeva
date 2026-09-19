"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { geocoderAdresse } from "@/lib/geocode";

function versUrlNouveauChantier(params: Record<string, string>): string {
  return `/admin/chantiers/nouveau?${new URLSearchParams(params).toString()}`;
}

function versUrlEditionChantier(id: string, params: Record<string, string>): string {
  return `/admin/chantiers/${id}?${new URLSearchParams(params).toString()}`;
}

function lireChampsChantier(formData: FormData) {
  return {
    nom: String(formData.get("nom") ?? "").trim(),
    client: String(formData.get("client") ?? "").trim(),
    adresse: String(formData.get("adresse") ?? "").trim(),
    type: String(formData.get("type") ?? ""),
    budgetHeuresBrut: String(formData.get("budget_heures") ?? "").trim(),
    statut: String(formData.get("statut") ?? "actif"),
  };
}

export async function creerChantier(formData: FormData) {
  const { supabase } = await requireAdmin();

  const { nom, client, adresse, type, budgetHeuresBrut, statut } = lireChampsChantier(formData);
  const champsAConserver = { nom, client, adresse, type, budget_heures: budgetHeuresBrut, statut };

  if (!nom || (type !== "regie" && type !== "forfait")) {
    redirect(versUrlNouveauChantier({ ...champsAConserver, erreur: "Nom et type sont requis." }));
  }

  const budgetHeures = type === "forfait" && budgetHeuresBrut ? Number(budgetHeuresBrut) : null;
  if (budgetHeures !== null && Number.isNaN(budgetHeures)) {
    redirect(versUrlNouveauChantier({ ...champsAConserver, erreur: "Budget d'heures invalide." }));
  }

  const geocode = adresse ? await geocoderAdresse(adresse) : null;

  const { data, error } = await supabase
    .from("chantiers")
    .insert({
      nom,
      client: client || null,
      adresse: adresse || null,
      type,
      budget_heures: budgetHeures,
      statut,
      latitude: geocode?.latitude ?? null,
      longitude: geocode?.longitude ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      versUrlNouveauChantier({ ...champsAConserver, erreur: error?.message ?? "Échec de la création." })
    );
  }

  revalidatePath("/admin/chantiers");
  const avertissement =
    adresse && !geocode
      ? `&avertissement=${encodeURIComponent("Géocodage impossible pour cette adresse")}`
      : "";
  redirect(`/admin/chantiers/${data.id}?cree=1${avertissement}`);
}

export async function modifierChantier(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const { nom, client, adresse, type, budgetHeuresBrut, statut } = lireChampsChantier(formData);
  const champsAConserver = { nom, client, adresse, type, budget_heures: budgetHeuresBrut, statut };

  if (!id || !nom || (type !== "regie" && type !== "forfait")) {
    redirect(versUrlEditionChantier(id, { ...champsAConserver, erreur: "Nom et type sont requis." }));
  }

  const budgetHeures = type === "forfait" && budgetHeuresBrut ? Number(budgetHeuresBrut) : null;
  if (budgetHeures !== null && Number.isNaN(budgetHeures)) {
    redirect(versUrlEditionChantier(id, { ...champsAConserver, erreur: "Budget d'heures invalide." }));
  }

  const { data: existant } = await supabase
    .from("chantiers")
    .select("adresse, latitude, longitude")
    .eq("id", id)
    .single();

  // Ne regéocoder que si l'adresse a réellement changé : un échec réseau
  // ponctuel ne doit pas effacer un GPS déjà correct pour une adresse
  // inchangée (cahier §7 "GPS ... jamais bloquant", étendu ici à "jamais
  // régressif").
  let latitude = existant?.latitude ?? null;
  let longitude = existant?.longitude ?? null;
  let echecGeocodage = false;

  if (adresse !== (existant?.adresse ?? "")) {
    if (!adresse) {
      latitude = null;
      longitude = null;
    } else {
      const geocode = await geocoderAdresse(adresse);
      if (geocode) {
        latitude = geocode.latitude;
        longitude = geocode.longitude;
      } else {
        latitude = null;
        longitude = null;
        echecGeocodage = true;
      }
    }
  }

  const { error } = await supabase
    .from("chantiers")
    .update({
      nom,
      client: client || null,
      adresse: adresse || null,
      type,
      budget_heures: budgetHeures,
      statut,
      latitude,
      longitude,
    })
    .eq("id", id);

  if (error) {
    redirect(versUrlEditionChantier(id, { ...champsAConserver, erreur: error.message }));
  }

  revalidatePath("/admin/chantiers");
  revalidatePath(`/admin/chantiers/${id}`);
  const avertissement = echecGeocodage
    ? `&avertissement=${encodeURIComponent("Géocodage impossible pour cette adresse")}`
    : "";
  redirect(`/admin/chantiers/${id}?modifie=1${avertissement}`);
}

// Bascule rapide actif<->archive depuis la liste (cahier consigne 9) : un
// chantier archivé sort de la liste de saisie des techniciens (RLS
// chantiers_select_actifs_or_admin, migration 0001) mais reste intact et
// consultable/exportable côté admin — aucune saisie n'est touchée. Le statut
// "terminé" reste réservé au formulaire d'édition complet (hors du champ de
// cette consigne, qui ne couvre qu'archivage/suppression).
export async function basculerArchivageChantier(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const nouveauStatut = String(formData.get("statut") ?? "");

  if (!id || (nouveauStatut !== "actif" && nouveauStatut !== "archive")) {
    redirect("/admin/chantiers");
  }

  const { error } = await supabase.from("chantiers").update({ statut: nouveauStatut }).eq("id", id);

  if (error) {
    redirect(`/admin/chantiers?erreur=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/chantiers");
  revalidatePath(`/admin/chantiers/${id}`);
  redirect("/admin/chantiers?statut_change=1");
}

// Suppression définitive, autorisée seulement si le chantier ne porte aucune
// saisie (cahier consigne 9) — sinon on explique pourquoi et on renvoie vers
// l'archivage. Confirmation en deux temps sur le modèle du doublon de saisie
// (src/app/actions/saisies.ts) plutôt qu'une confirm() navigateur : un
// premier appel sans confirmer=1 affiche un bandeau de confirmation, le
// second (confirmer=1) exécute réellement la suppression. La contrainte FK
// saisies.chantier_id ... on delete restrict (migration 0001) reste le
// filet de sécurité si une saisie est créée entre les deux appels.
export async function supprimerChantier(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const confirmer = formData.get("confirmer") === "1";

  if (!id) {
    redirect("/admin/chantiers");
  }

  const { count } = await supabase
    .from("saisies")
    .select("id", { count: "exact", head: true })
    .eq("chantier_id", id);

  if (count && count > 0) {
    redirect(
      `/admin/chantiers?erreur=${encodeURIComponent(
        `Suppression impossible : ce chantier porte ${count} saisie${count > 1 ? "s" : ""}. Archive-le plutôt : il disparaît de la liste de saisie des techniciens, mais l'historique reste intact.`
      )}`
    );
  }

  if (!confirmer) {
    redirect(`/admin/chantiers?confirmer_suppression=${id}`);
  }

  const { error } = await supabase.from("chantiers").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/chantiers?erreur=${encodeURIComponent(
        error.code === "23503"
          ? "Suppression impossible : une saisie a été ajoutée entre-temps. Archive-le plutôt."
          : `Échec de la suppression : ${error.message}`
      )}`
    );
  }

  revalidatePath("/admin/chantiers");
  redirect("/admin/chantiers?supprime=1");
}
