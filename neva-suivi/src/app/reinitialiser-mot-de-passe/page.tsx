import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { definirNouveauMotDePasse } from "@/app/actions/motDePasse";
import { Logo } from "@/components/Logo";
import { couleurs, styleBoutonPrimaire, styleChamp } from "@/lib/ui";

// Atteint uniquement via le lien "mot de passe oublié" (email ->
// /auth/callback?next=/reinitialiser-mot-de-passe -> ici), jamais depuis un
// menu : la session vient d'un lien de récupération, pas d'un login normal.
// Reste en français, même règle que /login : pas encore d'accès normal à
// l'application, donc pas de préférence de langue à appliquer (cahier
// consigne 8).
export default async function ReinitialiserMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main
      style={{
        maxWidth: 380,
        margin: "3rem auto",
        paddingLeft: "1.5rem",
        paddingRight: "1rem",
        fontFamily: "sans-serif",
        color: couleurs.texte,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <Logo hauteur={56} />
      </div>
      <h1 style={{ fontSize: "1.1rem", textAlign: "center", fontWeight: 600 }}>Choisis un nouveau mot de passe</h1>

      {erreur && (
        <p
          style={{
            color: couleurs.erreur,
            background: couleurs.erreurFond,
            border: `1.5px solid ${couleurs.erreur}`,
            borderRadius: 8,
            padding: "0.75rem",
          }}
        >
          {erreur}
        </p>
      )}

      <form action={definirNouveauMotDePasse} style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Nouveau mot de passe</span>
          <input name="mot_de_passe" type="password" autoComplete="new-password" required minLength={8} style={styleChamp} />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Confirmer le mot de passe</span>
          <input name="confirmation" type="password" autoComplete="new-password" required minLength={8} style={styleChamp} />
        </label>
        <button type="submit" style={{ ...styleBoutonPrimaire, marginTop: "0.25rem" }}>
          Valider
        </button>
      </form>
    </main>
  );
}
