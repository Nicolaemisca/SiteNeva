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

// L'admin saisit lui-même le mot de passe initial (cahier consigne 11) — plus
// d'auto-génération ici : il le communique de vive voix au technicien, qui
// devra le changer à sa première connexion (mot_de_passe_a_changer, forcé
// via src/proxy.ts). La réinitialisation (reinitialiserMotDePasse plus bas)
// reste inchangée : générée automatiquement, hors du champ de cette consigne.
export async function creerUtilisateur(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nom = String(formData.get("nom") ?? "").trim();
  const role = String(formData.get("role") ?? "technicien");
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!email || !nom || (role !== "admin" && role !== "technicien")) {
    redirect(versUrlUtilisateurs({ erreur: "Email, nom et rôle sont requis." }));
  }

  if (motDePasse.length < 8) {
    redirect(versUrlUtilisateurs({ erreur: "Le mot de passe initial doit faire au moins 8 caractères." }));
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { nom },
  });

  if (error || !data.user) {
    redirect(versUrlUtilisateurs({ erreur: `Échec de la création : ${error?.message ?? "erreur inconnue"}` }));
  }

  // Le trigger on_auth_user_created crée la ligne public.users avec
  // role='technicien' et mot_de_passe_a_changer=false par défaut ; on aligne
  // le rôle si besoin et on force le changement de mot de passe.
  const misesAJour: Record<string, unknown> = { mot_de_passe_a_changer: true };
  if (role === "admin") misesAJour.role = role;

  const { error: erreurMiseAJour } = await admin.from("users").update(misesAJour).eq("id", data.user.id);
  if (erreurMiseAJour) {
    redirect(
      versUrlUtilisateurs({
        erreur: `Compte créé mais rôle/statut non synchronisé : ${erreurMiseAJour.message}. Corrige-le manuellement.`,
      })
    );
  }

  revalidatePath("/admin/utilisateurs");
  redirect(versUrlUtilisateurs({ cree: email }));
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

// Suppression définitive, autorisée seulement si le compte ne porte aucune
// saisie (cahier consigne 14 : "même logique que pour les chantiers" —
// supprimerChantier, src/app/actions/chantiers.ts) — sinon on explique
// pourquoi et on renvoie vers la désactivation. Confirmation en deux temps
// sur le même modèle (bandeau, pas de confirm() navigateur).
export async function supprimerUtilisateur(formData: FormData) {
  const { supabase, user: adminConnecte } = await requireAdmin();
  const admin = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const confirmer = formData.get("confirmer") === "1";

  if (!id) {
    redirect("/admin/utilisateurs");
  }

  if (id === adminConnecte.id) {
    redirect(versUrlUtilisateurs({ erreur: "Impossible de supprimer ton propre compte." }));
  }

  const { count } = await supabase
    .from("saisies")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id);

  if (count && count > 0) {
    redirect(
      versUrlUtilisateurs({
        erreur: `Suppression impossible : ce compte porte ${count} saisie${count > 1 ? "s" : ""}. Désactive-le plutôt : il perd immédiatement l'accès, mais l'historique reste intact.`,
      })
    );
  }

  if (!confirmer) {
    redirect(versUrlUtilisateurs({ confirmer_suppression: id }));
  }

  // Supprime auth.users, qui entraîne la ligne public.users en cascade
  // (id uuid primary key references auth.users (id) on delete cascade,
  // migration 0001) — un seul appel, pas deux suppressions à synchroniser.
  //
  // Contrairement aux chantiers (saisies.chantier_id ... on delete restrict),
  // saisies.user_id est en on delete cascade : si une saisie apparaissait
  // entre le comptage ci-dessus et cet appel, elle serait supprimée en
  // cascade plutôt que de bloquer via une contrainte FK. Le trigger d'audit
  // (saisies_historiser_suppression, migration 0005) s'exécute quand même
  // sur cette suppression en cascade, mais échoue puisque l'appel passe par
  // le service_role (pas de session utilisateur, donc auth.uid() est null) —
  // ce qui fait échouer toute la transaction. Filet de sécurité différent
  // de celui des chantiers, mais qui aboutit au même résultat : on ne
  // distingue pas les causes d'échec ici, "désactive-le plutôt" reste le
  // bon conseil dans tous les cas à ce stade (le comptage a déjà écarté le
  // cas normal).
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    redirect(
      versUrlUtilisateurs({
        erreur: `Suppression impossible (${error.message}). Désactive ce compte plutôt.`,
      })
    );
  }

  revalidatePath("/admin/utilisateurs");
  redirect(versUrlUtilisateurs({ supprime: "1" }));
}

// Tarif horaire admin-only (cahier consigne 17) : table tarifs_horaires
// dédiée (migration 0010), jamais une colonne sur users — voir le
// commentaire de la migration. Champ vidé = tarif effacé plutôt qu'un 0
// qui laisserait croire à un tarif "gratuit" volontaire.
export async function definirTarifHoraire(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const tarifBrut = String(formData.get("tarif_horaire") ?? "").trim().replace(",", ".");

  if (!id) {
    redirect(versUrlUtilisateurs({ erreur: "Compte introuvable." }));
  }

  if (!tarifBrut) {
    const { error } = await supabase.from("tarifs_horaires").delete().eq("user_id", id);
    if (error) {
      redirect(versUrlUtilisateurs({ erreur: `Échec : ${error.message}` }));
    }
    revalidatePath("/admin/utilisateurs");
    redirect(versUrlUtilisateurs({ tarif_maj: "1" }));
  }

  const tarif = Number(tarifBrut);
  if (Number.isNaN(tarif) || tarif < 0) {
    redirect(versUrlUtilisateurs({ erreur: "Tarif horaire invalide." }));
  }

  const { error } = await supabase
    .from("tarifs_horaires")
    .upsert({ user_id: id, tarif_horaire: tarif, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (error) {
    redirect(versUrlUtilisateurs({ erreur: `Échec : ${error.message}` }));
  }

  revalidatePath("/admin/utilisateurs");
  redirect(versUrlUtilisateurs({ tarif_maj: "1" }));
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
