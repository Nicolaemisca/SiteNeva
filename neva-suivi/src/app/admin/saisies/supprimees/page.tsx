import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { couleurs, styleBoutonSecondaire } from "@/lib/ui";

const styleTh = { textAlign: "left", padding: "0.5rem", borderBottom: `2px solid ${couleurs.bordure}` } as const;
const styleTd = { padding: "0.5rem", borderBottom: "1px solid #e2e2e2" } as const;

type LigneSupprimee = {
  id: string;
  supprime_le: string;
  contenu: {
    date?: string;
    heures?: number;
    description?: string | null;
    materiel?: string | null;
    chantier_id?: string;
    user_id?: string;
  };
  users: { nom: string } | null;
};

export default async function SaisiesSupprimeesAdminPage() {
  const supabase = await createClient();

  const [{ data: supprimees, error }, { data: chantiers }, { data: personnes }] = await Promise.all([
    supabase
      .from("saisies_supprimees")
      .select("id, supprime_le, contenu, users(nom)")
      .order("supprime_le", { ascending: false }),
    supabase.from("chantiers").select("id, nom"),
    supabase.from("users").select("id, nom"),
  ]);

  const nomsChantiers = new Map((chantiers ?? []).map((c) => [c.id as string, c.nom as string]));
  const nomsPersonnes = new Map((personnes ?? []).map((p) => [p.id as string, p.nom as string]));
  const evenements = (supprimees ?? []) as unknown as LigneSupprimee[];

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Saisies supprimées</h1>
        <Link href="/admin/saisies" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
          Retour
        </Link>
      </div>

      <p style={{ color: couleurs.texteAttenue }}>
        Trace de toute suppression, remplie automatiquement (cahier consigne 10) — contenu tel qu'il était au moment
        de la suppression, jamais modifiable depuis cet écran.
      </p>

      {error && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
          {error.message}
        </p>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={styleTh}>Supprimée le</th>
            <th style={styleTh}>Supprimée par</th>
            <th style={styleTh}>Date de la saisie</th>
            <th style={styleTh}>Chantier</th>
            <th style={styleTh}>Personne</th>
            <th style={styleTh}>Heures</th>
            <th style={styleTh}>Description</th>
            <th style={styleTh}>Matériel</th>
          </tr>
        </thead>
        <tbody>
          {evenements.map((e) => (
            <tr key={e.id}>
              <td style={styleTd}>
                {new Date(e.supprime_le).toLocaleString("fr-BE", { dateStyle: "medium", timeStyle: "short" })}
              </td>
              <td style={styleTd}>{e.users?.nom ?? "utilisateur supprimé"}</td>
              <td style={styleTd}>{e.contenu.date ?? "—"}</td>
              <td style={styleTd}>
                {(e.contenu.chantier_id && nomsChantiers.get(e.contenu.chantier_id)) ?? "chantier supprimé"}
              </td>
              <td style={styleTd}>
                {(e.contenu.user_id && nomsPersonnes.get(e.contenu.user_id)) ?? "utilisateur supprimé"}
              </td>
              <td style={styleTd}>{e.contenu.heures != null ? Number(e.contenu.heures).toFixed(2) : "—"}</td>
              <td style={styleTd}>{e.contenu.description ?? "—"}</td>
              <td style={styleTd}>{e.contenu.materiel ?? "—"}</td>
            </tr>
          ))}
          {evenements.length === 0 && (
            <tr>
              <td style={styleTd} colSpan={8}>
                Aucune suppression enregistrée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
