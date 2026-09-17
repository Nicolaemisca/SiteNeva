import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { creerSaisie } from "@/app/actions/saisies";
import { signOut } from "@/app/actions/auth";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { Logo } from "@/components/Logo";
import { dateDuJourBelge } from "@/lib/date";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire, styleChamp } from "@/lib/ui";
import { ChampHeures } from "./ChampHeures";
import { SelectChantier } from "./SelectChantier";

const styleEtiquette = { fontWeight: 600, color: couleurs.texte } as const;

export default async function SaisiePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profil } = await supabase.from("users").select("nom, role").eq("id", user.id).single();

  // Seuls les chantiers actifs sont proposables à la saisie, admin compris
  // (cahier — les terminés/archivés restent consultables ailleurs, pas ici).
  // Triés par nom par défaut (fallback alphabétique, cahier §phase 4) — le
  // retri par distance se fait côté client une fois la géolocalisation
  // disponible (SelectChantier).
  const { data: chantiers, error: erreurChantiers } = await supabase
    .from("chantiers")
    .select("id, nom, client, latitude, longitude")
    .eq("statut", "actif")
    .order("nom");

  const date = params.date || dateDuJourBelge();
  const chantierId = params.chantier_id ?? "";
  const heures = params.heures ?? "";
  const description = params.description ?? "";
  const materiel = params.materiel ?? "";

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "1rem 1rem 3rem",
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Logo hauteur={40} />
          <div>
            <h1 style={{ fontSize: "1.05rem", margin: 0 }}>Saisie du jour</h1>
            {profil && (
              <p style={{ margin: 0, color: couleurs.texteAttenue, fontSize: "0.9rem" }}>
                {profil.nom}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link
            href="/historique"
            style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
          >
            Historique
          </Link>
          {profil?.role === "admin" && (
            <Link href="/admin/chantiers" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
              Back-office
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                minHeight: 40,
                padding: "0.5rem 0.85rem",
                borderRadius: 8,
                border: `1.5px solid ${couleurs.bordure}`,
                background: couleurs.fond,
                color: couleurs.texte,
              }}
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {params.envoye && (
        <p
          style={{
            color: couleurs.succes,
            background: couleurs.succesFond,
            border: `1.5px solid ${couleurs.succes}`,
            borderRadius: 8,
            padding: "0.75rem",
            fontWeight: 600,
          }}
        >
          Saisie enregistrée.
        </p>
      )}
      {params.erreur && (
        <p
          style={{
            color: couleurs.erreur,
            background: couleurs.erreurFond,
            border: `1.5px solid ${couleurs.erreur}`,
            borderRadius: 8,
            padding: "0.75rem",
          }}
        >
          {params.erreur}
        </p>
      )}
      {erreurChantiers && (
        <p
          style={{
            color: couleurs.erreur,
            background: couleurs.erreurFond,
            border: `1.5px solid ${couleurs.erreur}`,
            borderRadius: 8,
            padding: "0.75rem",
          }}
        >
          Impossible de charger les chantiers : {erreurChantiers.message}
        </p>
      )}

      {params.doublon && (
        <div
          style={{
            border: `1.5px solid ${couleurs.avertissement}`,
            background: couleurs.avertissementFond,
            borderRadius: 8,
            padding: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ margin: 0, color: couleurs.texte }}>
            Une saisie existe déjà pour ce chantier à cette date. Ajouter quand même ?
          </p>
          <form action={creerSaisie} style={{ marginTop: "0.75rem" }}>
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="chantier_id" value={chantierId} />
            <input type="hidden" name="heures" value={heures} />
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="materiel" value={materiel} />
            <input type="hidden" name="confirmer_doublon" value="1" />
            <BoutonEnvoi style={styleBoutonSecondaire} texteEnCours="Envoi…">
              Confirmer quand même
            </BoutonEnvoi>
          </form>
        </div>
      )}

      <form action={creerSaisie} style={{ display: "grid", gap: "1.25rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Date</span>
          <input name="date" type="date" defaultValue={date} required style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Chantier</span>
          <SelectChantier chantiers={chantiers ?? []} chantierIdInitial={chantierId} />
        </label>

        {/* Div, pas label : le label ne doit envelopper qu'un seul contrôle
            (cf. le champ Date juste au-dessus). Ici il y en a 5 (4 boutons +
            l'input) — enveloppés dans un <label>, le tap mobile sur un bouton
            se voyait parfois redirigé vers le premier contrôle du label (le
            clic souris desktop n'a pas ce problème, d'où le bug uniquement
            sur téléphone). */}
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span id="etiquette-heures" style={styleEtiquette}>
            Heures
          </span>
          <ChampHeures valeurInitiale={heures} />
        </div>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Description (optionnel)</span>
          <textarea
            name="description"
            defaultValue={description}
            rows={3}
            style={{ ...styleChamp, minHeight: undefined, resize: "vertical" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Matériel utilisé (optionnel)</span>
          <input name="materiel" type="text" defaultValue={materiel} style={styleChamp} />
        </label>

        <BoutonEnvoi style={styleBoutonPrimaire} texteEnCours="Enregistrement…">
          Enregistrer
        </BoutonEnvoi>
      </form>
    </main>
  );
}
