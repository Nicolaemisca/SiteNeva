import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Garde applicative en plus des policies RLS (cahier §5/§6 : back-office
// réservé à l'admin) — un technicien qui atterrit ici est renvoyé vers son
// écran plutôt que de voir un écran vide/en erreur RLS à chaque requête.
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profil } = await supabase
    .from("users")
    .select("nom, role")
    .eq("id", user.id)
    .single();

  if (!profil || profil.role !== "admin") {
    redirect("/saisie");
  }

  return { supabase, user, profil };
}
