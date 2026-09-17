import { sendMagicLink, signInWithPassword } from "@/app/actions/auth";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { Logo } from "@/components/Logo";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire, styleChamp } from "@/lib/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; lien_envoye?: string }>;
}) {
  const { erreur, lien_envoye } = await searchParams;

  // Cadre un peu plus compact que styleChamp pour les champs email/mot de
  // passe : demandé après test réel — styleChamp (48px/0.85rem) reste la
  // taille de référence pour l'écran de saisie.
  const styleChampConnexion = {
    ...styleChamp,
    minHeight: 42,
    padding: "0.55rem 0.75rem",
    fontSize: "1rem",
    // Le conteneur désactive la sélection de texte (cf. plus bas) : la
    // réactiver explicitement ici pour que les champs restent éditables.
    WebkitUserSelect: "text" as const,
    userSelect: "text" as const,
  };

  return (
    <main
      style={{
        maxWidth: 380,
        margin: "3rem auto",
        paddingLeft: "1.5rem",
        paddingRight: "1rem",
        fontFamily: "sans-serif",
        color: couleurs.texte,
        // Empêche la sélection de texte au doigt : sans ça, un geste pour
        // faire défiler la page qui frôle un mot le sélectionne au lieu de
        // scroller, donnant l'impression que le texte "bouge". Les champs de
        // saisie restent éditables : ceci ne s'applique qu'au texte
        // décoratif (titre, libellés, messages), pas à ce qu'on tape.
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <Logo hauteur={56} />
      </div>
      <h1 style={{ fontSize: "1.1rem", textAlign: "center", color: couleurs.texteAttenue, fontWeight: 600 }}>
        Suivi chantier
      </h1>

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
      {lien_envoye && (
        <p
          style={{
            color: couleurs.succes,
            background: couleurs.succesFond,
            border: `1.5px solid ${couleurs.succes}`,
            borderRadius: 8,
            padding: "0.75rem",
          }}
        >
          Lien de connexion envoyé par email.
        </p>
      )}

      <form action={signInWithPassword} style={{ display: "grid", gap: "0.75rem", marginTop: "2rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required style={styleChampConnexion} />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Mot de passe</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={styleChampConnexion}
          />
        </label>
        <BoutonEnvoi style={{ ...styleBoutonPrimaire, marginTop: "0.25rem" }} texteEnCours="Connexion…">
          Se connecter
        </BoutonEnvoi>
      </form>

      <form action={sendMagicLink} style={{ display: "grid", gap: "0.75rem", marginTop: "2rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Email (lien magique)</span>
          <input name="email" type="email" autoComplete="email" required style={styleChampConnexion} />
        </label>
        <BoutonEnvoi style={styleBoutonSecondaire} texteEnCours="Envoi…">
          Recevoir un lien de connexion
        </BoutonEnvoi>
      </form>
    </main>
  );
}
