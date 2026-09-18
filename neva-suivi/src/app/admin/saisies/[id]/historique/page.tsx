import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { couleurs, styleBoutonSecondaire } from "@/lib/ui";

// Colonnes de public.saisies dignes d'être montrées dans un diff ; id/
// user_id/created_at sont techniques ou ne changent jamais via l'écran de
// correction.
const LIBELLES: Record<string, string> = {
  date: "Date",
  chantier_id: "Chantier",
  heures: "Heures",
  description: "Description",
  materiel: "Matériel",
};

const styleTd = { padding: "0.4rem 0.6rem", borderBottom: "1px solid #e2e2e2" } as const;

type LigneHistorique = {
  id: string;
  modifie_le: string;
  ancien: Record<string, unknown>;
  nouveau: Record<string, unknown>;
  users: { nom: string } | null;
};

function formaterValeur(champ: string, valeur: unknown, nomsChantiers: Map<string, string>): string {
  if (valeur === null || valeur === undefined || valeur === "") return "—";
  if (champ === "chantier_id") return nomsChantiers.get(String(valeur)) ?? String(valeur);
  if (champ === "heures") return `${Number(valeur).toFixed(2)} h`;
  return String(valeur);
}

export default async function HistoriqueSaisieAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: saisie } = await supabase
    .from("saisies")
    .select("id, date, heures, chantiers(nom), users(nom)")
    .eq("id", id)
    .single<{ id: string; date: string; heures: number; chantiers: { nom: string } | null; users: { nom: string } | null }>();

  if (!saisie) {
    notFound();
  }

  const [{ data: historique }, { data: chantiers }] = await Promise.all([
    supabase
      .from("saisies_historique")
      .select("id, modifie_le, ancien, nouveau, users(nom)")
      .eq("saisie_id", id)
      .order("modifie_le", { ascending: false }),
    supabase.from("chantiers").select("id, nom"),
  ]);

  const nomsChantiers = new Map((chantiers ?? []).map((c) => [c.id as string, c.nom as string]));
  const evenements = (historique ?? []) as unknown as LigneHistorique[];

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Historique de la saisie</h1>
        <Link href="/admin/saisies" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
          Retour
        </Link>
      </div>

      <p style={{ color: couleurs.texteAttenue }}>
        {saisie.users?.nom ?? "—"} — {saisie.chantiers?.nom ?? "—"} — {saisie.date} — actuellement{" "}
        {Number(saisie.heures).toFixed(2)} h
      </p>

      {evenements.length === 0 && <p style={{ color: couleurs.texteAttenue }}>Aucune modification enregistrée.</p>}

      <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
        {evenements.map((e) => {
          const champsModifies = Object.keys(LIBELLES).filter(
            (champ) => JSON.stringify(e.ancien[champ]) !== JSON.stringify(e.nouveau[champ])
          );

          return (
            <div key={e.id} style={{ border: `1.5px solid ${couleurs.bordure}`, borderRadius: 8, padding: "0.85rem" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {new Date(e.modifie_le).toLocaleString("fr-BE", { dateStyle: "medium", timeStyle: "short" })} —{" "}
                {e.users?.nom ?? "utilisateur supprimé"}
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                <tbody>
                  {champsModifies.map((champ) => (
                    <tr key={champ}>
                      <td style={{ ...styleTd, fontWeight: 600, width: "30%" }}>{LIBELLES[champ]}</td>
                      <td style={{ ...styleTd, color: couleurs.erreur, textDecoration: "line-through" }}>
                        {formaterValeur(champ, e.ancien[champ], nomsChantiers)}
                      </td>
                      <td style={{ ...styleTd, color: couleurs.succes, fontWeight: 600 }}>
                        {formaterValeur(champ, e.nouveau[champ], nomsChantiers)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </main>
  );
}
