"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

const CARACTERES_MOT_DE_PASSE = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

// Pas d'envoi d'email dans ce projet : le mot de passe temporaire est
// généré aléatoirement puis affiché une seule fois à l'admin (via l'URL de
// redirection), à communiquer lui-même au technicien. Caractères ambigus
// (0/O, 1/l/I) exclus pour une dictée/lecture plus fiable à voix haute.
function genererMotDePasseTemporaire(): string {
  let motDePasse = "";
  for (let i = 0; i < 12; i++) {
    motDePasse += CARACTERES_MOT_DE_PASSE[Math.floor(Math.random() * CARACTERES_MOT_DE_PASSE.length)];
  }
  return motDePasse;
}

function versUrlUtilisateurs(params: Record<string, string>): string {
  return `/admin/utilisateurs?${new URLSearchParams(params).toString()}`;
}

export async function creerUtilisateur(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nom = String(formData.get("nom") ?? "").trim();
  const role = String(formData.get("role") ?? "technicien");

  if (!email || !nom || (role !== "admin" && role !== "technicien")) {
    redirect(versUrlUtilisateurs({ erreur: "Email, nom et rôle sont requis." }));
  }

  const motDePasseTemporaire = genererMotDePasseTemporaire();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: motDePasseTemporaire,
    email_confirm: true,
    user_metadata: { nom },
  });

  if (error || !data.user) {
    redirect(versUrlUtilisateurs({ erreur: `Échec de la création : ${error?.message ?? "erreur inconnue"}` }));
  }

  // Le trigger on_auth_user_created crée la ligne public.users avec
  // role='technicien' par défaut ; on l'aligne sur le rôle choisi si besoin.
  if (role === "admin") {
    const { error: erreurRole } = await admin.from("users").update({ role }).eq("id", data.user.id);
    if (erreurRole) {
      redirect(
        versUrlUtilisateurs({
          erreur: `Compte créé mais rôle non synchronisé : ${erreurRole.message}. Corrige-le manuellement.`,
        })
      );
    }
  }

  revalidatePath("/admin/utilisateurs");
  redirect(versUrlUtilisateurs({ cree: email, mot_de_passe: motDePasseTemporaire }));
}

export async function basculerActivation(formData: FormData) {
  const { user: admin } = await requireAdmin();
  const supabaseAdmin = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "1";

  if (!id) {
    redirect(versUrlUtilisateurs({ erreur: "Compte introuvable." }));
  }

  if (id === admin.id) {
    redirect(versUrlUtilisateurs({ erreur: "Impossible de désactiver ton propre compte." }));
  }

  const { error } = await supabaseAdmin.from("users").update({ actif }).eq("id", id);

  if (error) {
    redirect(versUrlUtilisateurs({ erreur: `Échec : ${error.message}` }));
  }

  // Ne supprime jamais le compte ni ses saisies : seul le champ actif
  // change, la ligne public.users et l'historique restent intacts.
  revalidatePath("/admin/utilisateurs");
  redirect(versUrlUtilisateurs({ statut_change: "1" }));
}

export async function reinitialiserMotDePasse(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");

  if (!id) {
    redirect(versUrlUtilisateurs({ erreur: "Compte introuvable." }));
  }

  const motDePasseTemporaire = genererMotDePasseTemporaire();

  const { error } = await admin.auth.admin.updateUserById(id, { password: motDePasseTemporaire });

  if (error) {
    redirect(versUrlUtilisateurs({ erreur: `Échec de la réinitialisation : ${error.message}` }));
  }

  redirect(versUrlUtilisateurs({ reinitialise: email, mot_de_passe: motDePasseTemporaire }));
}
