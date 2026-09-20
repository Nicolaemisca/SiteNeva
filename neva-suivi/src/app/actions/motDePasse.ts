"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Changement forcé à la première connexion (cahier consigne 11) : l'utilisateur
// change lui-même son mot de passe (session déjà ouverte, pas besoin de
// l'ancien) puis lève le drapeau mot_de_passe_a_changer via la fonction
// SECURITY DEFINER confirmer_changement_mot_de_passe() (migration 0006) — la
// policy "users_update_admin_only" (migration 0001) lui interdirait de le
// faire par un update direct.
export async function changerMotDePasseInitial(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const motDePasseActuel = String(formData.get("mot_de_passe_actuel") ?? "");
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!motDePasseActuel) {
    redirect(
      `/changer-mot-de-passe?erreur=${encodeURIComponent("Le mot de passe actuel (fourni par l'admin) est requis.")}`
    );
  }

  if (motDePasse.length < 8) {
    redirect(
      `/changer-mot-de-passe?erreur=${encodeURIComponent("Le nouveau mot de passe doit faire au moins 8 caractères.")}`
    );
  }

  if (motDePasse !== confirmation) {
    redirect(`/changer-mot-de-passe?erreur=${encodeURIComponent("Les deux mots de passe ne correspondent pas.")}`);
  }

  // Ce projet Supabase exige le mot de passe actuel pour en fixer un nouveau
  // (GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD) — cohérent
  // avec le cahier : le technicien connaît déjà ce mot de passe, il vient de
  // s'en servir pour se connecter.
  const { error } = await supabase.auth.updateUser({
    password: motDePasse,
    current_password: motDePasseActuel,
  });

  if (error) {
    redirect(`/changer-mot-de-passe?erreur=${encodeURIComponent(error.message)}`);
  }

  await supabase.rpc("confirmer_changement_mot_de_passe");

  redirect("/saisie");
}

// "Mot de passe oublié" (src/app/actions/auth.ts,
// demanderReinitialisationMotDePasse) : la session ici vient d'un lien de
// récupération envoyé par email, pas d'une connexion classique — pas de
// champ mot de passe actuel à demander, updateUser() ne l'exige pas dans ce
// cas précis (vérifié empiriquement, contrairement à changerMotDePasseInitial
// ci-dessus). Lève aussi mot_de_passe_a_changer au passage (sans effet si
// déjà à false) : cette voie satisfait tout autant l'obligation de la
// consigne 11 que l'écran dédié.
export async function definirNouveauMotDePasse(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (motDePasse.length < 8) {
    redirect(
      `/reinitialiser-mot-de-passe?erreur=${encodeURIComponent("Le mot de passe doit faire au moins 8 caractères.")}`
    );
  }

  if (motDePasse !== confirmation) {
    redirect(
      `/reinitialiser-mot-de-passe?erreur=${encodeURIComponent("Les deux mots de passe ne correspondent pas.")}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password: motDePasse });

  if (error) {
    redirect(`/reinitialiser-mot-de-passe?erreur=${encodeURIComponent(error.message)}`);
  }

  await supabase.rpc("confirmer_changement_mot_de_passe");

  redirect("/saisie");
}
