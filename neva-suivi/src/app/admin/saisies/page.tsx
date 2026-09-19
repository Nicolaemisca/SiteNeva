import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supprimerSaisiesAdmin } from "@/app/actions/saisiesAdmin";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire } from "@/lib/ui";

const styleBoutonDanger = {
  ...styleBoutonSecondaire,
  borderColor: couleurs.erreur,
  color: couleurs.erreur,
} as const;

function normaliserIds(valeur: string | string[] | undefined): string[] {
  if (!valeur) return [];
  return Array.isArray(valeur) ? valeur : [valeur];
}

// Les filtres (chantier_id, user_id, du, au) ne sont jamais répétés dans
// l'URL, contrairement à supprimer_ids (une valeur par ligne cochée) : on ne
// garde que la première si jamais un lien mal formé en répète un.
function unParam(valeur: string | string[] | undefined): string | undefined {
  return Array.isArray(valeur) ? valeur[0] : valeur;
}

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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const chantierId = unParam(params.chantier_id);
  const userId = unParam(params.user_id);
  const du = unParam(params.du);
  const au = unParam(params.au);
  const erreur = unParam(params.erreur);
  const supprime = unParam(params.supprime);
  const idsAConfirmer = normaliserIds(params.supprimer_ids);

  const supabase = await createClient();

  const [{ data: chantiers }, { data: personnes }] = await Promise.all([
    supabase.from("chantiers").select("id, nom").order("nom"),
    supabase.from("users").select("id, nom").order("nom"),
  ]);

  let requete = supabase
    .from("saisies")
    .select("id, date, heures, description, materiel, chantiers(nom), users(nom)")
    .order("date", { ascending: false });

  if (chantierId) requete = requete.eq("chantier_id", chantierId);
  if (userId) requete = requete.eq("user_id", userId);
  if (du) requete = requete.gte("date", du);
  if (au) requete = requete.lte("date", au);

  const { data, error } = await requete;
  const saisies = (data ?? []) as unknown as LigneSaisie[];

  // Un seul aller-retour pour savoir quelles lignes ont un historique de
  // modification (consigne 4) plutôt qu'une requête par ligne affichée.
  const { data: modifications } = await supabase.from("saisies_historique").select("saisie_id");
  const idsModifies = new Set((modifications ?? []).map((m) => m.saisie_id as string));

  const totalHeures = saisies.reduce((somme, s) => somme + Number(s.heures), 0);

  const filtresActifs: Record<string, string> = {};
  if (chantierId) filtresActifs.chantier_id = chantierId;
  if (userId) filtresActifs.user_id = userId;
  if (du) filtresActifs.du = du;
  if (au) filtresActifs.au = au;
  const requeteExport = new URLSearchParams(filtresActifs).toString();
  const urlFiltree = requeteExport ? `/admin/saisies?${requeteExport}` : "/admin/saisies";

  // Les lignes sélectionnées pour suppression appartiennent forcément à la
  // vue déjà chargée (cochées dans ce même tableau) : pas besoin d'une
  // requête séparée pour le bandeau de confirmation.
  const saisiesAConfirmer = saisies.filter((s) => idsAConfirmer.includes(s.id));
  const totalAConfirmer = saisiesAConfirmer.reduce((somme, s) => somme + Number(s.heures), 0);

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Saisies</h1>
        <Link href="/admin/saisies/supprimees" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
          Voir les suppressions
        </Link>
      </div>

      <form
        method="get"
        style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end", margin: "1.25rem 0" }}
      >
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>Chantier</span>
          <select name="chantier_id" defaultValue={chantierId ?? ""} style={styleChamp}>
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
          <select name="user_id" defaultValue={userId ?? ""} style={styleChamp}>
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
          <input type="date" name="du" defaultValue={du ?? ""} style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>Au</span>
          <input type="date" name="au" defaultValue={au ?? ""} style={styleChamp} />
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

      {erreur && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
          {erreur}
        </p>
      )}

      {supprime && (
        <p style={{ color: couleurs.succes, background: couleurs.succesFond, border: `1.5px solid ${couleurs.succes}`, borderRadius: 8, padding: "0.75rem", fontWeight: 600 }}>
          {supprime} saisie{supprime !== "1" ? "s" : ""} supprimée{supprime !== "1" ? "s" : ""}.
        </p>
      )}

      {saisiesAConfirmer.length > 0 && (
        <div style={{ border: `1.5px solid ${couleurs.avertissement}`, background: couleurs.avertissementFond, borderRadius: 8, padding: "0.85rem", margin: "1rem 0" }}>
          <p style={{ margin: 0 }}>
            Supprimer définitivement {saisiesAConfirmer.length} saisie{saisiesAConfirmer.length > 1 ? "s" : ""} (
            {totalAConfirmer.toFixed(2)} h au total) ? Cette action est irréversible, mais reste tracée (qui, quand,
            contenu) dans « Voir les suppressions ».
          </p>
          <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
            {saisiesAConfirmer.map((s) => (
              <li key={s.id}>
                {s.date} — {s.chantiers?.nom ?? "—"} — {s.users?.nom ?? "—"} — {Number(s.heures).toFixed(2)} h
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <form action={supprimerSaisiesAdmin}>
              {saisiesAConfirmer.map((s) => (
                <input key={s.id} type="hidden" name="ids" value={s.id} />
              ))}
              <button type="submit" style={styleBoutonDanger}>
                Confirmer la suppression
              </button>
            </form>
            <Link href={urlFiltree} style={styleBoutonSecondaire}>
              Annuler
            </Link>
          </div>
        </div>
      )}

      <p>
        <strong>Total : {totalHeures.toFixed(2)} h</strong> ({saisies.length} saisie
        {saisies.length > 1 ? "s" : ""})
      </p>

      <form method="get">
        {chantierId && <input type="hidden" name="chantier_id" value={chantierId} />}
        {userId && <input type="hidden" name="user_id" value={userId} />}
        {du && <input type="hidden" name="du" value={du} />}
        {au && <input type="hidden" name="au" value={au} />}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={styleTh} />
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
                <td style={styleTd}>
                  <input type="checkbox" name="supprimer_ids" value={s.id} aria-label="Sélectionner pour suppression" />
                </td>
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
                <td style={styleTd} colSpan={8}>
                  Aucune saisie pour ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {saisies.length > 0 && (
          <button type="submit" style={{ ...styleBoutonDanger, marginTop: "1rem" }}>
            Supprimer la sélection
          </button>
        )}
      </form>
    </main>
  );
}
