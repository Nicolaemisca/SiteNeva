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
