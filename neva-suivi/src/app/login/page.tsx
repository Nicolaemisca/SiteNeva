import { demanderReinitialisationMotDePasse, signInWithPassword } from "@/app/actions/auth";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { Logo } from "@/components/Logo";
import { couleurs, ombre, rayon, styleBoutonPrimaire, styleBoutonSecondaire, styleCarte, styleChamp } from "@/lib/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; reinitialisation_envoyee?: string }>;
}) {
  const { erreur, reinitialisation_envoyee } = await searchParams;

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
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        // Fond doux en dégradé radial, pas un simple aplat : donne de la
        // profondeur à l'écran d'accueil sans nuire au contraste du contenu,
        // qui reste sur la carte blanche par-dessus.
        background: `radial-gradient(circle at 50% -10%, #dfe7f1 0%, ${couleurs.fondPage} 55%)`,
        fontFamily: "var(--font-sans), sans-serif",
        color: couleurs.texte,
        WebkitUserSelect: "none",
        userSelect: "none",
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
        {/* Liseré de marque en haut de carte : seule touche de couleur forte
            de l'écran, pour signer sans alourdir (cahier : sobre, très
            contrasté). */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: `linear-gradient(90deg, ${couleurs.primaire}, ${couleurs.accent})`,
          }}
        />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <Logo hauteur={52} />
        </div>
        <h1
          style={{
            fontSize: "1.05rem",
            textAlign: "center",
            color: couleurs.texteAttenue,
            fontWeight: 600,
            margin: "0 0 1.75rem",
          }}
        >
          Suivi chantier
        </h1>

        {erreur && (
          <p
            style={{
              color: couleurs.erreur,
              background: couleurs.erreurFond,
              border: `1.5px solid ${couleurs.erreur}`,
              borderRadius: rayon.petit,
              padding: "0.75rem",
            }}
          >
            {erreur}
          </p>
        )}
        {reinitialisation_envoyee && (
          <p
            style={{
              color: couleurs.succes,
              background: couleurs.succesFond,
              border: `1.5px solid ${couleurs.succes}`,
              borderRadius: rayon.petit,
              padding: "0.75rem",
            }}
          >
            Si un compte existe avec cette adresse, un email a été envoyé pour choisir un nouveau mot de passe.
          </p>
        )}

        <form action={signInWithPassword} style={{ display: "grid", gap: "0.75rem" }}>
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

        {/* <details> natif plutôt qu'un état React : replie la demande de
            réinitialisation par défaut (écran moins chargé), sans JS ni
            composant client. */}
        <details style={{ marginTop: "1.5rem" }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: "0.9rem",
              color: couleurs.primaire,
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            Mot de passe oublié ?
          </summary>
          <form
            action={demanderReinitialisationMotDePasse}
            style={{ display: "grid", gap: "0.75rem", marginTop: "0.85rem" }}
          >
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.9rem" }}>Email</span>
              <input name="email" type="email" autoComplete="email" required style={styleChampConnexion} />
            </label>
            <BoutonEnvoi style={styleBoutonSecondaire} texteEnCours="Envoi…">
              Choisir un nouveau mot de passe
            </BoutonEnvoi>
          </form>
        </details>
      </div>
    </main>
  );
}
