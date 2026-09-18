import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire } from "@/lib/ui";

const styleTh = { textAlign: "left", padding: "0.5rem", borderBottom: `2px solid ${couleurs.bordure}` } as const;
const styleTd = { padding: "0.5rem", borderBottom: "1px solid #e2e2e2" } as const;

const LIBELLE_STATUT: Record<string, string> = {
  actif: "Actif",
  termine: "Terminé",
  archive: "Archivé",
};

export default async function ChantiersAdminPage() {
  const supabase = await createClient();

  // Toutes statuts confondus : l'admin gère aussi les terminés/archivés
  // (RLS chantiers_select_actifs_or_admin le permet déjà pour ce rôle).
  const { data: chantiers, error } = await supabase
    .from("chantiers")
    .select("id, nom, client, type, statut, budget_heures")
    .order("nom");

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
                <Link
                  href={`/admin/chantiers/${chantier.id}`}
                  style={{ ...styleBoutonSecondaire, minHeight: 36, padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                >
                  Modifier
                </Link>
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
