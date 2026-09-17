"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function versUrlSaisie(params: Record<string, string>): string {
  return `/saisie?${new URLSearchParams(params).toString()}`;
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
  const heuresBrut = String(formData.get("heures") ?? "").trim().replace(",", ".");
  const description = String(formData.get("description") ?? "").trim();
  const materiel = String(formData.get("materiel") ?? "").trim();
  const confirmerDoublon = formData.get("confirmer_doublon") === "1";

  const champsAConserver = {
    date,
    chantier_id: chantierId,
    heures: heuresBrut,
    description,
    materiel,
  };

  const heures = Number(heuresBrut);

  if (!date || !chantierId || !heuresBrut || Number.isNaN(heures) || heures <= 0 || heures > 24) {
    redirect(
      versUrlSaisie({
        ...champsAConserver,
        erreur: "Date, chantier et heures (entre 0 et 24) sont requis.",
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
    heures,
    description: description || null,
    materiel: materiel || null,
  });

  if (error) {
    redirect(versUrlSaisie({ ...champsAConserver, erreur: error.message }));
  }

  revalidatePath("/saisie");
  redirect("/saisie?envoye=1");
}
