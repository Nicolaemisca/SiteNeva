import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Porte d'entrée : l'écran de saisie (phase 2) est la destination unique
// après connexion, pour aller le plus vite possible du login au formulaire.
export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  redirect("/saisie");
}
