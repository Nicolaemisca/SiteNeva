import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { modifierChantier } from "@/app/actions/chantiers";
import { styleChamp } from "@/lib/ui";
import { ChampTypeChantier } from "../ChampTypeChantier";

export default async function ChantierAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: chantier } = await supabase
    .from("chantiers")
    .select("id, nom, client, adresse, type, budget_heures, statut, latitude, longitude")
    .eq("id", id)
    .single();

  if (!chantier) {
    notFound();
  }

  const nom = query.nom ?? chantier.nom;
  const client = query.client ?? chantier.client ?? "";
  const adresse = query.adresse ?? chantier.adresse ?? "";
  const type = query.type ?? chantier.type;
  const budgetHeures = query.budget_heures ?? (chantier.budget_heures?.toString() ?? "");
  const statut = query.statut ?? chantier.statut;

  return (
    <main style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: "1.1rem" }}>Modifier le chantier</h1>

      {query.cree && <p style={{ color: "#0a7a0a" }}>Chantier créé.</p>}
      {query.modifie && <p style={{ color: "#0a7a0a" }}>Chantier mis à jour.</p>}
      {query.avertissement && <p style={{ color: "#d99a00" }}>{query.avertissement}</p>}
      {query.erreur && <p style={{ color: "#b00020" }}>{query.erreur}</p>}

      <form action={modifierChantier} style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
        <input type="hidden" name="id" value={chantier.id} />

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Nom</span>
          <input name="nom" type="text" defaultValue={nom} required style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Client</span>
          <input name="client" type="text" defaultValue={client} style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Adresse</span>
          <input name="adresse" type="text" defaultValue={adresse} style={styleChamp} />
          <span style={{ fontSize: "0.8rem", color: "#666" }}>
            {chantier.latitude != null && chantier.longitude != null
              ? `GPS actuel : ${chantier.latitude.toFixed(5)}, ${chantier.longitude.toFixed(5)}`
              : "Pas de GPS enregistré."}
          </span>
        </label>

        <ChampTypeChantier typeInitial={type} budgetHeuresInitial={budgetHeures} />

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Statut</span>
          <select name="statut" defaultValue={statut} style={styleChamp}>
            <option value="actif">Actif</option>
            <option value="termine">Terminé</option>
            <option value="archive">Archivé</option>
          </select>
        </label>

        <button
          type="submit"
          style={{
            fontSize: "1.1rem",
            fontWeight: "bold",
            padding: "1rem",
            minHeight: 48,
            borderRadius: 8,
            border: "none",
            background: "#0a5a9c",
            color: "#fff",
          }}
        >
          Enregistrer
        </button>
      </form>
    </main>
  );
}
