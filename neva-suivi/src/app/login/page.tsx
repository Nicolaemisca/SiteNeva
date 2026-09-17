import { sendMagicLink, signInWithPassword } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; lien_envoye?: string }>;
}) {
  const { erreur, lien_envoye } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.25rem" }}>Neva Energy — Suivi chantier</h1>

      {erreur && <p style={{ color: "#b00020" }}>{erreur}</p>}
      {lien_envoye && (
        <p style={{ color: "#0a7a0a" }}>Lien de connexion envoyé par email.</p>
      )}

      <form action={signInWithPassword} style={{ display: "grid", gap: "0.5rem", marginTop: "1.5rem" }}>
        <label>
          Email
          <input name="email" type="email" required style={{ width: "100%" }} />
        </label>
        <label>
          Mot de passe
          <input name="password" type="password" required style={{ width: "100%" }} />
        </label>
        <button type="submit">Se connecter</button>
      </form>

      <form action={sendMagicLink} style={{ display: "grid", gap: "0.5rem", marginTop: "1.5rem" }}>
        <label>
          Email (lien magique)
          <input name="email" type="email" required style={{ width: "100%" }} />
        </label>
        <button type="submit">Recevoir un lien de connexion</button>
      </form>
    </main>
  );
}
