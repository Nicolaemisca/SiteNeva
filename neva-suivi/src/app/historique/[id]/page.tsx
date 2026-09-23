import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateDuJourBelge } from "@/lib/date";
import { modifierSaisie } from "@/app/actions/saisies";
import { couleurs, ombre, rayon, styleBoutonPrimaire, styleBoutonSecondaire, styleCarte, styleChamp } from "@/lib/ui";
import { ModeSaisieHeures } from "@/app/saisie/ModeSaisieHeures";
import { SelectChantier } from "@/app/saisie/SelectChantier";
import { Alerte } from "@/components/Alerte";
import { Logo } from "@/components/Logo";
import { dictionnaires, estLangueValide } from "@/lib/i18n/dictionnaires";

const styleEtiquette = { fontWeight: 600, color: couleurs.texte } as const;

// Même règle que public.within_correction_window() côté base.
function estModifiable(date: string, aujourdHui: string): boolean {
  const diffJours = (Date.parse(aujourdHui) - Date.parse(date)) / 86_400_000;
  return diffJours <= 7;
}

type ParametresRecherche = {
  erreur?: string;
  date?: string;
  chantier_id?: string;
  mode?: string;
  heures?: string;
  heure_debut?: string;
  heure_fin?: string;
  pause_minutes?: string;
  description?: string;
  materiel?: string;
};

export default async function ModifierSaisiePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParametresRecherche>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS filtre déjà aux propres saisies de l'utilisateur (ou à l'admin) :
  // .single() renvoie une erreur si la ligne n'existe pas ou n'est pas la
  // sienne, traité ici comme un 404 plutôt que de fuiter l'information.
  const { data: saisie } = await supabase
    .from("saisies")
    .select("id, date, chantier_id, heures, heure_debut, heure_fin, pause_minutes, description, materiel")
    .eq("id", id)
    .single();

  if (!user || !saisie) {
    notFound();
  }

  const { data: profil } = await supabase.from("users").select("langue").eq("id", user.id).single();
  const langue = estLangueValide(profil?.langue) ? profil.langue : "fr";
  const t = dictionnaires[langue];

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

  // En cas d'erreur de soumission, l'action republie les champs saisis via
  // l'URL (src/app/actions/saisies.ts) : ils priment sur les valeurs en
  // base pour ne pas faire perdre la correction en cours.
  const date = query.date ?? saisie.date;
  const chantierId = query.chantier_id ?? saisie.chantier_id;
  const modeInitial = (query.mode as "total" | "horaires" | undefined) ?? (saisie.heure_debut ? "horaires" : "total");
  const heures = query.heures ?? String(saisie.heures);
  const heureDebut = query.heure_debut ?? saisie.heure_debut ?? "";
  const heureFin = query.heure_fin ?? saisie.heure_fin ?? "";
  const pauseMinutes = query.pause_minutes ?? (saisie.pause_minutes != null ? String(saisie.pause_minutes) : "");
  const description = query.description ?? saisie.description ?? "";
  const materiel = query.materiel ?? saisie.materiel ?? "";

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        paddingTop: "1rem",
        paddingBottom: "3rem",
        paddingLeft: "1.5rem",
        paddingRight: "1rem",
        fontFamily: "var(--font-sans), sans-serif",
        color: couleurs.texte,
        background: couleurs.fondPage,
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          marginLeft: "-1.5rem",
          marginRight: "-1rem",
          padding: "0.85rem 1rem 0.85rem 1.5rem",
          background: couleurs.fond,
          borderRadius: `0 0 ${rayon.moyen}px ${rayon.moyen}px`,
          boxShadow: ombre.legere,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Logo hauteur={32} lien="/saisie" libelleLien={t.nav.accueil} />
          <h1 style={{ fontSize: "1.05rem", margin: 0 }}>{t.historiquePage.corrigerTitre}</h1>
        </div>
        <Link
          href="/historique"
          style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
        >
          {t.boutons.annuler}
        </Link>
      </header>

      {query.erreur && (
        <div style={{ marginBottom: "1rem" }}>
          <Alerte variante="erreur">{query.erreur}</Alerte>
        </div>
      )}

      <form action={modifierSaisie} style={{ ...styleCarte, display: "grid", gap: "1.25rem", padding: "1.5rem" }}>
        <input type="hidden" name="id" value={saisie.id} />

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.champs.date}</span>
          <input name="date" type="date" defaultValue={date} required style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.champs.chantier}</span>
          <SelectChantier chantiers={chantiers ?? []} chantierIdInitial={chantierId} langue={langue} />
        </label>

        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span id="etiquette-heures" style={styleEtiquette}>
            {t.champs.heures}
          </span>
          <ModeSaisieHeures
            modeInitial={modeInitial}
            valeurInitiale={heures}
            debutInitial={heureDebut}
            finInitial={heureFin}
            pauseInitiale={pauseMinutes}
            langue={langue}
          />
        </div>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.champs.description}</span>
          <textarea
            name="description"
            defaultValue={description}
            rows={3}
            style={{ ...styleChamp, minHeight: undefined, resize: "vertical" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.champs.materiel}</span>
          <input name="materiel" type="text" defaultValue={materiel} style={styleChamp} />
        </label>

        <button type="submit" style={styleBoutonPrimaire}>
          {t.boutons.enregistrerCorrection}
        </button>
      </form>
    </main>
  );
}
