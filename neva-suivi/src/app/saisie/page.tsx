import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { creerSaisie } from "@/app/actions/saisies";
import { signOut } from "@/app/actions/auth";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { Logo } from "@/components/Logo";
import { dateDuJourBelge } from "@/lib/date";
import { calculerSuggestion } from "@/lib/suggestionSaisie";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire, styleChamp } from "@/lib/ui";
import { dictionnaires, estLangueValide } from "@/lib/i18n/dictionnaires";
import { ModeSaisieHeures } from "./ModeSaisieHeures";
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

  const { data: profil } = await supabase.from("users").select("nom, role, langue").eq("id", user.id).single();
  const langue = estLangueValide(profil?.langue) ? profil.langue : "fr";
  const t = dictionnaires[langue];

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
  const description = params.description ?? "";
  const materiel = params.materiel ?? "";

  // Ni chantier ni heures déjà fournis par l'URL (erreur/doublon à
  // republier) : premier passage sur un formulaire vierge, c'est le seul cas
  // où la suggestion doit s'appliquer — jamais par-dessus une saisie déjà en
  // cours de correction par l'utilisateur.
  let suggestion: ReturnType<typeof calculerSuggestion> = { chantierId: null, heures: null, horaires: null };
  if (!params.chantier_id && !params.heures && !params.heure_debut) {
    const aujourdHui = dateDuJourBelge();
    const { data: saisiesRecentes } = await supabase
      .from("saisies")
      .select("date, chantier_id, heures, heure_debut, heure_fin, pause_minutes")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.parse(aujourdHui) - 14 * 86_400_000).toISOString().slice(0, 10))
      .lt("date", aujourdHui);

    suggestion = calculerSuggestion(saisiesRecentes ?? [], aujourdHui);
  }

  const chantierId = params.chantier_id ?? suggestion.chantierId ?? "";
  const nomChantierSuggere = suggestion.chantierId
    ? chantiers?.find((c) => c.id === suggestion.chantierId)?.nom
    : null;

  // Le mode horaires ne s'impose que s'il a une suggestion à offrir ; sinon
  // le mode total reste par défaut (le plus rapide, cahier §2).
  const modeInitial = (params.mode as "total" | "horaires" | undefined) ?? (suggestion.horaires ? "horaires" : "total");
  const heures = params.heures ?? (suggestion.heures != null ? String(suggestion.heures) : "");
  const heureDebut = params.heure_debut ?? suggestion.horaires?.debut ?? "";
  const heureFin = params.heure_fin ?? suggestion.horaires?.fin ?? "";
  const pauseMinutes = params.pause_minutes ?? (suggestion.horaires ? String(suggestion.horaires.pauseMinutes) : "");

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
          paddingBottom: "1rem",
          borderBottom: `1.5px solid ${couleurs.bordure}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Logo hauteur={40} lien="/saisie" libelleLien={t.nav.accueil} />
          <div>
            <h1 style={{ fontSize: "1.05rem", margin: 0 }}>{t.saisiePage.titre}</h1>
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
            {t.nav.historique}
          </Link>
          <Link
            href="/profil"
            style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
          >
            {t.nav.profil}
          </Link>
          {profil?.role === "admin" && (
            <>
              <Link href="/pointage" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
                Pointage
              </Link>
              <Link href="/admin" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
                {t.nav.backOffice}
              </Link>
            </>
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
              {t.nav.deconnexion}
            </button>
          </form>
        </div>
      </header>

      {params.envoye && (
        <div
          className="apparition-douce"
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            color: couleurs.succes,
            background: couleurs.succesFond,
            border: `1.5px solid ${couleurs.succes}`,
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "0.5rem",
            fontWeight: 700,
            fontSize: "1.05rem",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: couleurs.succes,
              color: "#fff",
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            ✓
          </span>
          {t.saisiePage.saisieEnregistree}
        </div>
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
          {t.saisiePage.erreurChargementChantiers} : {erreurChantiers.message}
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
          <p style={{ margin: 0, color: couleurs.texte }}>{t.saisiePage.doublonMessage}</p>
          <form action={creerSaisie} style={{ marginTop: "0.75rem" }}>
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="chantier_id" value={chantierId} />
            <input type="hidden" name="mode" value={modeInitial} />
            <input type="hidden" name="heures" value={heures} />
            <input type="hidden" name="heure_debut" value={heureDebut} />
            <input type="hidden" name="heure_fin" value={heureFin} />
            <input type="hidden" name="pause_minutes" value={pauseMinutes} />
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="materiel" value={materiel} />
            <input type="hidden" name="confirmer_doublon" value="1" />
            <BoutonEnvoi style={styleBoutonSecondaire} texteEnCours={t.boutons.envoi}>
              {t.boutons.confirmerQuandMeme}
            </BoutonEnvoi>
          </form>
        </div>
      )}

      {(nomChantierSuggere || suggestion.heures != null || suggestion.horaires) && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.6rem",
            border: `1.5px solid ${couleurs.primaire}`,
            background: "#eaf1f8",
            borderRadius: 8,
            padding: "0.85rem",
            marginBottom: "1.25rem",
          }}
        >
          <span aria-hidden style={{ fontSize: "1.1rem", lineHeight: 1 }}>
            💡
          </span>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            <strong>{t.saisiePage.suggestionIntro}</strong>
            {nomChantierSuggere ? ` : ${nomChantierSuggere}` : ""}
            {suggestion.horaires
              ? `${nomChantierSuggere ? "," : " :"} ${suggestion.horaires.debut}–${suggestion.horaires.fin}`
              : suggestion.heures != null
                ? `${nomChantierSuggere ? "," : " :"} ${suggestion.heures}h`
                : ""}{" "}
            — {t.saisiePage.suggestionSuffixe}
          </p>
        </div>
      )}

      <form action={creerSaisie} style={{ display: "grid", gap: "1.25rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.champs.date}</span>
          <input name="date" type="date" defaultValue={date} required style={styleChamp} />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.champs.chantier}</span>
          <SelectChantier chantiers={chantiers ?? []} chantierIdInitial={chantierId} langue={langue} />
        </label>

        {/* Div, pas label : le label ne doit envelopper qu'un seul contrôle
            (cf. le champ Date juste au-dessus). Ici il y en a 5 (4 boutons +
            l'input) — enveloppés dans un <label>, le tap mobile sur un bouton
            se voyait parfois redirigé vers le premier contrôle du label (le
            clic souris desktop n'a pas ce problème, d'où le bug uniquement
            sur téléphone). */}
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

        <BoutonEnvoi style={styleBoutonPrimaire} texteEnCours={t.boutons.enregistrement}>
          {t.boutons.enregistrer}
        </BoutonEnvoi>
      </form>
    </main>
  );
}
