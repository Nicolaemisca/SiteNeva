import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  creerUtilisateur,
  basculerActivation,
  reinitialiserMotDePasse,
  supprimerUtilisateur,
} from "@/app/actions/utilisateurs";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire, styleChamp } from "@/lib/ui";

const styleTh = { textAlign: "left", padding: "0.5rem", borderBottom: `2px solid ${couleurs.bordure}` } as const;
const styleTd = { padding: "0.5rem", borderBottom: "1px solid #e2e2e2", verticalAlign: "top" } as const;

const styleBoutonDanger = {
  ...styleBoutonSecondaire,
  minHeight: 36,
  padding: "0.35rem 0.75rem",
  fontSize: "0.85rem",
  borderColor: couleurs.erreur,
  color: couleurs.erreur,
} as const;

const styleBoutonMini = {
  ...styleBoutonSecondaire,
  minHeight: 36,
  padding: "0.35rem 0.75rem",
  fontSize: "0.85rem",
} as const;

type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "technicien";
  actif: boolean;
};

export default async function UtilisateursAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, nom, email, role, actif")
    .order("nom");

  const utilisateurs = (data ?? []) as Utilisateur[];
  const utilisateurAConfirmer = params.confirmer_suppression
    ? utilisateurs.find((u) => u.id === params.confirmer_suppression)
    : null;

  return (
    <main>
      <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Utilisateurs</h1>

      {params.erreur && (
        <p
          style={{
            color: couleurs.erreur,
            background: couleurs.erreurFond,
            border: `1.5px solid ${couleurs.erreur}`,
            borderRadius: 8,
            padding: "0.75rem",
            marginTop: "1rem",
          }}
        >
          {params.erreur}
        </p>
      )}

      {params.statut_change && (
        <p
          style={{
            color: couleurs.succes,
            background: couleurs.succesFond,
            border: `1.5px solid ${couleurs.succes}`,
            borderRadius: 8,
            padding: "0.75rem",
            marginTop: "1rem",
            fontWeight: 600,
          }}
        >
          Statut du compte mis à jour.
        </p>
      )}

      {params.supprime && (
        <p
          style={{
            color: couleurs.succes,
            background: couleurs.succesFond,
            border: `1.5px solid ${couleurs.succes}`,
            borderRadius: 8,
            padding: "0.75rem",
            marginTop: "1rem",
            fontWeight: 600,
          }}
        >
          Compte supprimé.
        </p>
      )}

      {utilisateurAConfirmer && (
        <div
          style={{
            border: `1.5px solid ${couleurs.avertissement}`,
            background: couleurs.avertissementFond,
            borderRadius: 8,
            padding: "0.85rem",
            marginTop: "1rem",
          }}
        >
          <p style={{ margin: 0 }}>
            Supprimer définitivement <strong>{utilisateurAConfirmer.nom}</strong> ({utilisateurAConfirmer.email}) ?
            Cette action est irréversible.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <form action={supprimerUtilisateur}>
              <input type="hidden" name="id" value={utilisateurAConfirmer.id} />
              <input type="hidden" name="confirmer" value="1" />
              <button type="submit" style={styleBoutonDanger}>
                Confirmer la suppression
              </button>
            </form>
            <Link href="/admin/utilisateurs" style={styleBoutonMini}>
              Annuler
            </Link>
          </div>
        </div>
      )}

      {params.cree && (
        <p
          style={{
            color: couleurs.succes,
            background: couleurs.succesFond,
            border: `1.5px solid ${couleurs.succes}`,
            borderRadius: 8,
            padding: "0.75rem",
            marginTop: "1rem",
            fontWeight: 600,
          }}
        >
          Compte créé : {params.cree}. Il devra changer son mot de passe à sa première connexion.
        </p>
      )}

      {params.reinitialise && params.mot_de_passe && (
        <div
          style={{
            border: `1.5px solid ${couleurs.succes}`,
            background: couleurs.succesFond,
            borderRadius: 8,
            padding: "1rem",
            marginTop: "1rem",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: couleurs.succes }}>
            Mot de passe réinitialisé : {params.reinitialise}
          </p>
          <p style={{ margin: "0.5rem 0 0", color: couleurs.texte }}>
            Mot de passe temporaire (affiché une seule fois — communique-le au technicien) :
          </p>
          <p
            style={{
              margin: "0.35rem 0 0",
              fontFamily: "monospace",
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              background: couleurs.fond,
              border: `1.5px solid ${couleurs.bordure}`,
              borderRadius: 6,
              padding: "0.5rem 0.75rem",
              display: "inline-block",
            }}
          >
            {params.mot_de_passe}
          </p>
        </div>
      )}

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Nouveau compte</h2>
        <form
          action={creerUtilisateur}
          style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}
        >
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem" }}>Nom</span>
            <input name="nom" type="text" required style={{ ...styleChamp, minHeight: 44, width: 200 }} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem" }}>Email</span>
            <input name="email" type="email" required style={{ ...styleChamp, minHeight: 44, width: 240 }} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem" }}>Rôle</span>
            <select name="role" defaultValue="technicien" style={{ ...styleChamp, minHeight: 44, width: 160 }}>
              <option value="technicien">Technicien</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem" }}>Mot de passe initial</span>
            {/* type="text", pas "password" : l'admin le dicte de vive voix au
                technicien juste après (cahier consigne 11), pas besoin de le
                masquer à lui-même pendant qu'il le tape. */}
            <input
              name="mot_de_passe"
              type="text"
              required
              minLength={8}
              autoComplete="off"
              style={{ ...styleChamp, minHeight: 44, width: 200, fontFamily: "monospace" }}
            />
          </label>
          <button type="submit" style={{ ...styleBoutonPrimaire, minHeight: 44 }}>
            Créer le compte
          </button>
        </form>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Comptes existants</h2>

        {error && (
          <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
            {error.message}
          </p>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.75rem" }}>
          <thead>
            <tr>
              <th style={styleTh}>Nom</th>
              <th style={styleTh}>Email</th>
              <th style={styleTh}>Rôle</th>
              <th style={styleTh}>Statut</th>
              <th style={styleTh} />
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id}>
                <td style={styleTd}>{u.nom}</td>
                <td style={styleTd}>{u.email}</td>
                <td style={styleTd}>{u.role === "admin" ? "Admin" : "Technicien"}</td>
                <td style={styleTd}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.6rem",
                      borderRadius: 999,
                      color: u.actif ? couleurs.succes : couleurs.texteAttenue,
                      background: u.actif ? couleurs.succesFond : "#f0f0f0",
                    }}
                  >
                    {u.actif ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td style={styleTd}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <form action={reinitialiserMotDePasse}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="email" value={u.email} />
                      <button type="submit" style={styleBoutonMini}>
                        Réinitialiser mot de passe
                      </button>
                    </form>
                    <form action={basculerActivation}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="actif" value={u.actif ? "0" : "1"} />
                      <button type="submit" style={u.actif ? styleBoutonDanger : styleBoutonMini}>
                        {u.actif ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                    <form action={supprimerUtilisateur}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" style={styleBoutonDanger}>
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {utilisateurs.length === 0 && (
              <tr>
                <td style={styleTd} colSpan={5}>
                  Aucun compte.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
