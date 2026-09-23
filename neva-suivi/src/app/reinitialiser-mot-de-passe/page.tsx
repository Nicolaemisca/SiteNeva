import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { definirNouveauMotDePasse } from "@/app/actions/motDePasse";
import { Logo } from "@/components/Logo";
import { couleurs, ombre, rayon, styleBoutonPrimaire, styleCarte, styleChamp } from "@/lib/ui";

// Atteint uniquement via le lien "mot de passe oublié" (email ->
// /auth/recuperation -> ici), jamais depuis un menu : la session vient d'un
// lien de récupération, pas d'un login normal.
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
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        background: `radial-gradient(circle at 50% -10%, #dfe7f1 0%, ${couleurs.fondPage} 55%)`,
        fontFamily: "var(--font-sans), sans-serif",
        color: couleurs.texte,
      }}
    >
      <div
        style={{
          ...styleCarte,
          width: "100%",
          maxWidth: 400,
          padding: "2.25rem 2rem 2rem",
          borderRadius: rayon.grand,
          boxShadow: ombre.moyenne,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: `linear-gradient(90deg, ${couleurs.primaire}, ${couleurs.accentVert})`,
          }}
        />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <Logo hauteur={52} />
        </div>
        <h1 style={{ fontSize: "1.05rem", textAlign: "center", fontWeight: 600, margin: "0 0 1.5rem" }}>
          Choisis un nouveau mot de passe
        </h1>

        {erreur && (
          <p
            style={{
              color: couleurs.erreur,
              background: couleurs.erreurFond,
              border: `1.5px solid ${couleurs.erreur}`,
              borderRadius: rayon.petit,
              padding: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {erreur}
          </p>
        )}

        <form action={definirNouveauMotDePasse} style={{ display: "grid", gap: "0.75rem" }}>
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
      </div>
    </main>
  );
}
