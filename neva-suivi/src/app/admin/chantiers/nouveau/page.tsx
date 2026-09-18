import { creerChantier } from "@/app/actions/chantiers";
import { couleurs, styleBoutonPrimaire, styleChamp } from "@/lib/ui";
import { ChampTypeChantier } from "../ChampTypeChantier";

export default async function NouveauChantierPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  return (
    <main style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: "1.1rem" }}>Nouveau chantier</h1>

      {params.erreur && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
          {params.erreur}
        </p>
      )}

      <form action={creerChantier} style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Nom</span>
          <input name="nom" type="text" defaultValue={params.nom} required style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Client</span>
          <input name="client" type="text" defaultValue={params.client} style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Adresse</span>
          <input name="adresse" type="text" defaultValue={params.adresse} style={styleChamp} />
          <span style={{ fontSize: "0.8rem", color: couleurs.texteAttenue }}>
            Les coordonnées GPS sont déduites automatiquement de l&apos;adresse.
          </span>
        </label>

        <ChampTypeChantier
          typeInitial={params.type ?? "regie"}
          budgetHeuresInitial={params.budget_heures ?? ""}
        />

        <input type="hidden" name="statut" value="actif" />

        <button type="submit" style={styleBoutonPrimaire}>
          Créer le chantier
        </button>
      </form>
    </main>
  );
}
