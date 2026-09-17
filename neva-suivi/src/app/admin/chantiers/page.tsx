import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const styleTh = { textAlign: "left", padding: "0.5rem", borderBottom: "2px solid #ddd" } as const;
const styleTd = { padding: "0.5rem", borderBottom: "1px solid #eee" } as const;

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
        <Link
          href="/admin/chantiers/nouveau"
          style={{
            padding: "0.6rem 1rem",
            borderRadius: 8,
            background: "#0a5a9c",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          + Nouveau chantier
        </Link>
      </div>

      {error && <p style={{ color: "#b00020" }}>{error.message}</p>}

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
                <Link href={`/admin/chantiers/${chantier.id}`}>Modifier</Link>
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
