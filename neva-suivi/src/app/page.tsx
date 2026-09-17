import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

// Page de vérification de la phase 1 : confirme que la session est valide
// et que la ligne public.users associée (nom, rôle) est lisible via RLS.
// Les écrans de saisie et de back-office arrivent en phase 2+.
export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profil, error } = await supabase
    .from("users")
    .select("nom, role, actif")
    .eq("id", user.id)
    .single();

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.25rem" }}>Neva Energy — Suivi chantier</h1>

      {error && <p style={{ color: "#b00020" }}>Erreur de lecture du profil : {error.message}</p>}

      {profil && (
        <p>
          Connecté en tant que <strong>{profil.nom}</strong> — rôle <strong>{profil.role}</strong>
          {!profil.actif && " (compte désactivé)"}
        </p>
      )}

      <form action={signOut}>
        <button type="submit">Se déconnecter</button>
      </form>
    </main>
  );
}
