import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateDuJourBelge } from "@/lib/date";
import { modifierSaisie } from "@/app/actions/saisies";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire, styleChamp } from "@/lib/ui";
import { ChampHeures } from "@/app/saisie/ChampHeures";
import { SelectChantier } from "@/app/saisie/SelectChantier";

const styleEtiquette = { fontWeight: 600, color: couleurs.texte } as const;

// Même règle que public.within_correction_window() côté base.
function estModifiable(date: string, aujourdHui: string): boolean {
  const diffJours = (Date.parse(aujourdHui) - Date.parse(date)) / 86_400_000;
  return diffJours <= 7;
}

export default async function ModifierSaisiePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS filtre déjà aux propres saisies de l'utilisateur (ou à l'admin) :
  // .single() renvoie une erreur si la ligne n'existe pas ou n'est pas la
  // sienne, traité ici comme un 404 plutôt que de fuiter l'information.
  const { data: saisie } = await supabase
    .from("saisies")
    .select("id, date, chantier_id, heures, description, materiel")
    .eq("id", id)
    .single();

  if (!user || !saisie) {
    notFound();
  }

  const aujourdHui = dateDuJourBelge();
  if (!estModifiable(saisie.date, aujourdHui)) {
    notFound();
  }

  // Chantiers actifs + celui déjà assigné à cette saisie même s'il a été
  // archivé depuis (sinon il disparaîtrait du select et on ne pourrait plus
  // enregistrer sans le changer involontairement).
  const { data: chantiers } = await supabase
    .from("chantiers")
    .select("id, nom, client, latitude, longitude")
    .or(`statut.eq.actif,id.eq.${saisie.chantier_id}`)
    .order("nom");

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        paddingTop: "1rem",
        paddingBottom: "3rem",
        paddingLeft: "1.5rem",
        paddingRight: "1rem",
        fontFamily: "sans-serif",
        color: couleurs.texte,
        background: couleurs.fond,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          paddingBottom: "1rem",
          borderBottom: `1.5px solid ${couleurs.bordure}`,
        }}
      >
        <h1 style={{ fontSize: "1.05rem", margin: 0 }}>Corriger la saisie</h1>
        <Link
          href="/historique"
          style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
        >
          Annuler
        </Link>
      </header>

      {erreur && (
        <p
          style={{
            color: couleurs.erreur,
            background: couleurs.erreurFond,
            border: `1.5px solid ${couleurs.erreur}`,
            borderRadius: 8,
            padding: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {erreur}
        </p>
      )}

      <form action={modifierSaisie} style={{ display: "grid", gap: "1.25rem" }}>
        <input type="hidden" name="id" value={saisie.id} />

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Date</span>
          <input name="date" type="date" defaultValue={saisie.date} required style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Chantier</span>
          <SelectChantier chantiers={chantiers ?? []} chantierIdInitial={saisie.chantier_id} />
        </label>

        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span id="etiquette-heures" style={styleEtiquette}>
            Heures
          </span>
          <ChampHeures valeurInitiale={String(saisie.heures)} />
        </div>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Description (optionnel)</span>
          <textarea
            name="description"
            defaultValue={saisie.description ?? ""}
            rows={3}
            style={{ ...styleChamp, minHeight: undefined, resize: "vertical" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Matériel utilisé (optionnel)</span>
          <input name="materiel" type="text" defaultValue={saisie.materiel ?? ""} style={styleChamp} />
        </label>

        <button type="submit" style={styleBoutonPrimaire}>
          Enregistrer la correction
        </button>
      </form>
    </main>
  );
}
