import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { couleurs, styleBoutonPrimaire } from "@/lib/ui";

const styleChamp = {
  fontSize: "1rem",
  padding: "0.5rem",
  borderRadius: 6,
  border: `1px solid ${couleurs.bordure}`,
  // Le <body> désactive la sélection de texte globalement (layout.tsx) :
  // la réactiver ici pour que ces champs de filtre restent utilisables.
  WebkitUserSelect: "text",
  userSelect: "text",
} as const;

const styleTh = { textAlign: "left", padding: "0.5rem", borderBottom: `2px solid ${couleurs.bordure}` } as const;
const styleTd = { padding: "0.5rem", borderBottom: "1px solid #e2e2e2" } as const;

type LigneSaisie = {
  id: string;
  date: string;
  heures: number | string;
  description: string | null;
  materiel: string | null;
  chantiers: { nom: string } | null;
  users: { nom: string } | null;
};

export default async function SaisiesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: chantiers }, { data: personnes }] = await Promise.all([
    supabase.from("chantiers").select("id, nom").order("nom"),
    supabase.from("users").select("id, nom").order("nom"),
  ]);

  let requete = supabase
    .from("saisies")
    .select("id, date, heures, description, materiel, chantiers(nom), users(nom)")
    .order("date", { ascending: false });

  if (params.chantier_id) requete = requete.eq("chantier_id", params.chantier_id);
  if (params.user_id) requete = requete.eq("user_id", params.user_id);
  if (params.du) requete = requete.gte("date", params.du);
  if (params.au) requete = requete.lte("date", params.au);

  const { data, error } = await requete;
  const saisies = (data ?? []) as unknown as LigneSaisie[];

  // Un seul aller-retour pour savoir quelles lignes ont un historique de
  // modification (consigne 4) plutôt qu'une requête par ligne affichée.
  const { data: modifications } = await supabase.from("saisies_historique").select("saisie_id");
  const idsModifies = new Set((modifications ?? []).map((m) => m.saisie_id as string));

  const totalHeures = saisies.reduce((somme, s) => somme + Number(s.heures), 0);

  const filtresActifs: Record<string, string> = {};
  if (params.chantier_id) filtresActifs.chantier_id = params.chantier_id;
  if (params.user_id) filtresActifs.user_id = params.user_id;
  if (params.du) filtresActifs.du = params.du;
  if (params.au) filtresActifs.au = params.au;
  const requeteExport = new URLSearchParams(filtresActifs).toString();

  return (
    <main>
      <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Saisies</h1>

      <form
        method="get"
        style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end", margin: "1.25rem 0" }}
      >
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>Chantier</span>
          <select name="chantier_id" defaultValue={params.chantier_id ?? ""} style={styleChamp}>
            <option value="">Tous</option>
            {chantiers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>Personne</span>
          <select name="user_id" defaultValue={params.user_id ?? ""} style={styleChamp}>
            <option value="">Toutes</option>
            {personnes?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>Du</span>
          <input type="date" name="du" defaultValue={params.du ?? ""} style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>Au</span>
          <input type="date" name="au" defaultValue={params.au ?? ""} style={styleChamp} />
        </label>

        <button type="submit" style={styleChamp}>
          Filtrer
        </button>

        <a
          href={`/admin/export${requeteExport ? `?${requeteExport}` : ""}`}
          style={{ ...styleBoutonPrimaire, fontSize: "1rem", padding: "0.6rem 1rem", minHeight: 40, textDecoration: "none" }}
        >
          Exporter Excel
        </a>
      </form>

      {error && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
          {error.message}
        </p>
      )}

      <p>
        <strong>Total : {totalHeures.toFixed(2)} h</strong> ({saisies.length} saisie
        {saisies.length > 1 ? "s" : ""})
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={styleTh}>Date</th>
            <th style={styleTh}>Chantier</th>
            <th style={styleTh}>Personne</th>
            <th style={styleTh}>Heures</th>
            <th style={styleTh}>Description</th>
            <th style={styleTh}>Matériel</th>
            <th style={styleTh} />
          </tr>
        </thead>
        <tbody>
          {saisies.map((s) => (
            <tr key={s.id}>
              <td style={styleTd}>{s.date}</td>
              <td style={styleTd}>{s.chantiers?.nom ?? "—"}</td>
              <td style={styleTd}>{s.users?.nom ?? "—"}</td>
              <td style={styleTd}>{Number(s.heures).toFixed(2)}</td>
              <td style={styleTd}>{s.description ?? "—"}</td>
              <td style={styleTd}>{s.materiel ?? "—"}</td>
              <td style={styleTd}>
                {idsModifies.has(s.id) && (
                  <Link
                    href={`/admin/saisies/${s.id}/historique`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: couleurs.avertissement,
                      border: `1.5px solid ${couleurs.avertissement}`,
                      borderRadius: 999,
                      padding: "0.2rem 0.6rem",
                      textDecoration: "none",
                    }}
                  >
                    Modifiée
                  </Link>
                )}
              </td>
            </tr>
          ))}
          {saisies.length === 0 && (
            <tr>
              <td style={styleTd} colSpan={7}>
                Aucune saisie pour ces filtres.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
