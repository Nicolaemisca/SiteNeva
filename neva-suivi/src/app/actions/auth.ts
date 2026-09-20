"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?erreur=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// "Mot de passe oublié" : une session "recovery" (resetPasswordForEmail)
// dispense de fournir l'ancien mot de passe pour en poser un nouveau —
// vérifié empiriquement, updateUser() réussit sans current_password
// uniquement dans ce cas précis, alors que ce projet l'exige normalement
// (GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD). Le "next"
// redirige après l'échange de code vers l'écran de saisie du nouveau mot de
// passe plutôt que directement dans l'application (src/app/auth/callback/route.ts).
export async function demanderReinitialisationMotDePasse(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent("/reinitialiser-mot-de-passe")}`,
  });

  if (error) {
    redirect(`/login?erreur=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?reinitialisation_envoyee=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
