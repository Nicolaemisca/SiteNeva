import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changerMotDePasseInitial } from "@/app/actions/motDePasse";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";
import { couleurs, ombre, rayon, styleBoutonPrimaire, styleCarte, styleChamp } from "@/lib/ui";

// Écran de passage obligé (proxy.ts) avant tout accès quand
// mot_de_passe_a_changer = true (cahier consigne 11). Reste en français,
// même règle que /login : la préférence de langue (/profil) n'a de sens
// qu'une fois l'accès normal à l'application établi.
export default async function ChangerMotDePassePage({
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
        <h1 style={{ fontSize: "1.05rem", textAlign: "center", fontWeight: 600, margin: "0 0 0.5rem" }}>
          Choisis ton mot de passe
        </h1>
        <p style={{ color: couleurs.texteAttenue, textAlign: "center", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          Ton compte a été créé avec un mot de passe provisoire. Choisis-en un nouveau avant de continuer.
        </p>

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

        <form action={changerMotDePasseInitial} style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Mot de passe actuel (fourni par l&apos;admin)</span>
            <input name="mot_de_passe_actuel" type="password" autoComplete="current-password" required style={styleChamp} />
          </label>
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

        <form action={signOut} style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            type="submit"
            style={{ background: "none", border: "none", color: couleurs.texteAttenue, textDecoration: "underline", fontSize: "0.85rem" }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
