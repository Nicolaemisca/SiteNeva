"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Une seule action couvre suppression unique et multiple (cahier consigne
// 10) : cocher une ligne ou plusieurs revient au même côté serveur. La trace
// (qui/quand/quoi) est posée par le trigger saisies_historiser_suppression
// (migration 0005), jamais par ce code — even si la suppression venait d'un
// autre chemin plus tard, elle resterait tracée.
export async function supprimerSaisiesAdmin(formData: FormData) {
  const { supabase } = await requireAdmin();

  const ids = formData.getAll("ids").map(String).filter(Boolean);

  if (ids.length === 0) {
    redirect("/admin/saisies");
  }

  const { error, count } = await supabase
    .from("saisies")
    .delete({ count: "exact" })
    .in("id", ids);

  if (error) {
    redirect(`/admin/saisies?erreur=${encodeURIComponent(`Échec de la suppression : ${error.message}`)}`);
  }

  revalidatePath("/admin/saisies");
  redirect(`/admin/saisies?supprime=${count ?? ids.length}`);
}
