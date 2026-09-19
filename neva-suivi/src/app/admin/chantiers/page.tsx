import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { basculerArchivageChantier, supprimerChantier } from "@/app/actions/chantiers";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire } from "@/lib/ui";

const styleTh = { textAlign: "left", padding: "0.5rem", borderBottom: `2px solid ${couleurs.bordure}` } as const;
const styleTd = { padding: "0.5rem", borderBottom: "1px solid #e2e2e2" } as const;

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

const LIBELLE_STATUT: Record<string, string> = {
  actif: "Actif",
  termine: "Terminé",
  archive: "Archivé",
};

export default async function ChantiersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; statut_change?: string; supprime?: string; confirmer_suppression?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Toutes statuts confondus : l'admin gère aussi les terminés/archivés
  // (RLS chantiers_select_actifs_or_admin le permet déjà pour ce rôle).
  const { data: chantiers, error } = await supabase
    .from("chantiers")
    .select("id, nom, client, type, statut, budget_heures")
    .order("nom");

  const chantierAConfirmer = params.confirmer_suppression
    ? chantiers?.find((c) => c.id === params.confirmer_suppression)
    : null;

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Chantiers</h1>
        <Link href="/admin/chantiers/nouveau" style={{ ...styleBoutonPrimaire, textDecoration: "none", padding: "0.6rem 1.1rem", minHeight: 44 }}>
          + Nouveau chantier
        </Link>
      </div>

      {error && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
          {error.message}
        </p>
      )}

      {params.erreur && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem", marginTop: "1rem" }}>
          {params.erreur}
        </p>
      )}

      {(params.statut_change || params.supprime) && (
        <p style={{ color: couleurs.succes, background: couleurs.succesFond, border: `1.5px solid ${couleurs.succes}`, borderRadius: 8, padding: "0.75rem", marginTop: "1rem", fontWeight: 600 }}>
          {params.supprime ? "Chantier supprimé." : "Statut du chantier mis à jour."}
        </p>
      )}

      {chantierAConfirmer && (
        <div style={{ border: `1.5px solid ${couleurs.avertissement}`, background: couleurs.avertissementFond, borderRadius: 8, padding: "0.85rem", marginTop: "1rem" }}>
          <p style={{ margin: 0 }}>
            Supprimer définitivement <strong>{chantierAConfirmer.nom}</strong> ? Cette action est irréversible.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <form action={supprimerChantier}>
              <input type="hidden" name="id" value={chantierAConfirmer.id} />
              <input type="hidden" name="confirmer" value="1" />
              <button type="submit" style={styleBoutonDanger}>
                Confirmer la suppression
              </button>
            </form>
            <Link href="/admin/chantiers" style={styleBoutonMini}>
              Annuler
            </Link>
          </div>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1.25rem" }}>
        <thead>
          <tr>
            <th style={styleTh}>Nom</th>
            <th style={styleTh}>Client</th>
            <th style={styleTh}>Type</th>
            <th style={styleTh}>Statut</th>
            <th style={styleTh} />
          </tr>
        </thead>
        <tbody>
          {chantiers?.map((chantier) => (
            <tr key={chantier.id}>
              <td style={styleTd}>{chantier.nom}</td>
              <td style={styleTd}>{chantier.client ?? "—"}</td>
              <td style={styleTd}>
                {chantier.type === "forfait"
                  ? `Forfait${chantier.budget_heures ? ` (${chantier.budget_heures} h)` : ""}`
                  : "Régie"}
              </td>
              <td style={styleTd}>{LIBELLE_STATUT[chantier.statut] ?? chantier.statut}</td>
              <td style={styleTd}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link href={`/admin/chantiers/${chantier.id}`} style={styleBoutonMini}>
                    Modifier
                  </Link>
                  <form action={basculerArchivageChantier}>
                    <input type="hidden" name="id" value={chantier.id} />
                    <input type="hidden" name="statut" value={chantier.statut === "archive" ? "actif" : "archive"} />
                    <button type="submit" style={styleBoutonMini}>
                      {chantier.statut === "archive" ? "Réactiver" : "Archiver"}
                    </button>
                  </form>
                  <form action={supprimerChantier}>
                    <input type="hidden" name="id" value={chantier.id} />
                    <button type="submit" style={styleBoutonDanger}>
                      Supprimer
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {chantiers?.length === 0 && (
            <tr>
              <td style={styleTd} colSpan={5}>
                Aucun chantier.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
