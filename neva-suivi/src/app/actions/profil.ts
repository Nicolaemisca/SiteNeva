"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dictionnaires, estLangueValide } from "@/lib/i18n/dictionnaires";

// Ne modifie que public.users.langue (cahier consigne 8) : les écrans
// technicien (saisie, historique, profil) la lisent, le back-office admin
// reste toujours en français quel que soit ce réglage.
export async function modifierLangue(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const langue = formData.get("langue");

  if (!estLangueValide(langue)) {
    redirect("/profil");
  }

  // Update direct impossible : la policy RLS "users_update_admin_only"
  // (migration 0001) réserve l'update de public.users à l'admin. La fonction
  // definir_langue() (migration 0004) est une porte étroite, réservée à ce
  // seul champ, pour que chaque utilisateur reste maître de sa langue sans
  // pouvoir toucher au reste de sa ligne (rôle, actif...).
  const { error } = await supabase.rpc("definir_langue", { p_langue: langue });

  if (error) {
    redirect(`/profil?erreur=${encodeURIComponent(dictionnaires[langue].profilPage.erreurEnregistrement)}`);
  }

  revalidatePath("/profil");
  redirect("/profil?enregistre=1");
}
