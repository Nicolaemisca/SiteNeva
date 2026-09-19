import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changerMotDePasseInitial } from "@/app/actions/motDePasse";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";
import { couleurs, styleBoutonPrimaire, styleChamp } from "@/lib/ui";

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
      <h1 style={{ fontSize: "1.1rem", textAlign: "center", fontWeight: 600 }}>Choisis ton mot de passe</h1>
      <p style={{ color: couleurs.texteAttenue, textAlign: "center", fontSize: "0.9rem" }}>
        Ton compte a été créé avec un mot de passe provisoire. Choisis-en un nouveau avant de continuer.
      </p>

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

      <form action={changerMotDePasseInitial} style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
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
    </main>
  );
}
