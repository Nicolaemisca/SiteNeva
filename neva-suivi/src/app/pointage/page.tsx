import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { signOut } from "@/app/actions/auth";
import { enregistrerArrivee, supprimerPointage } from "@/app/actions/pointage";
import { Alerte } from "@/components/Alerte";
import { Logo } from "@/components/Logo";
import { SelectChantier } from "@/app/saisie/SelectChantier";
import { dateDuJourBelge } from "@/lib/date";
import { couleurs, ombre, rayon, styleBoutonPrimaire, styleBoutonSecondaire, styleCarte } from "@/lib/ui";
import { BoutonArrivee } from "./BoutonArrivee";

const styleEtiquette = { fontWeight: 600, color: couleurs.texte } as const;

function heureBelge(horodatage: string): string {
  return new Date(horodatage).toLocaleTimeString("fr-BE", {
    timeZone: "Europe/Brussels",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Réservé au compte admin (cahier consigne 15) : requireAdmin() renvoie tout
// technicien vers /saisie. Page hors de /admin/* volontairement — elle se
// consulte sur téléphone en marchant vers un chantier, pas depuis le
// back-office bureau (mêmes contraintes tactiles/lisibilité que /saisie,
// pas la mise en page desktop du layout admin).
export default async function PointagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, profil } = await requireAdmin();
  const date = dateDuJourBelge();

  const { data: chantiers, error: erreurChantiers } = await supabase
    .from("chantiers")
    .select("id, nom, client, latitude, longitude")
    .eq("statut", "actif")
    .order("nom");

  const { data: pointages, error: erreurPointages } = await supabase
    .from("pointages")
    .select("id, chantier_id, horodatage, latitude, longitude, chantiers(nom)")
    .eq("user_id", user.id)
    .eq("date", date)
    .order("horodatage", { ascending: true });

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
          <Logo hauteur={40} lien="/saisie" libelleLien="Accueil" />
          <div>
            <h1 style={{ fontSize: "1.05rem", margin: 0 }}>Pointage</h1>
            <p style={{ margin: 0, color: couleurs.texteAttenue, fontSize: "0.9rem" }}>{profil.nom}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/saisie" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
            Ma saisie
          </Link>
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

      {params.enregistre && (
        <div style={{ marginBottom: "1.25rem" }}>
          <Alerte variante="succes">Arrivée pointée.</Alerte>
        </div>
      )}
      {params.supprime && (
        <p style={{ color: couleurs.texteAttenue, marginBottom: "1.25rem" }}>Pointage supprimé.</p>
      )}
      {params.journee_cloturee && (
        <div style={{ marginBottom: "1.25rem" }}>
          <Alerte variante="succes">Journée clôturée : les heures ont été ajoutées à tes saisies du jour.</Alerte>
        </div>
      )}
      {params.erreur && (
        <div style={{ marginBottom: "1.25rem" }}>
          <Alerte variante="erreur">{params.erreur}</Alerte>
        </div>
      )}
      {(erreurChantiers || erreurPointages) && (
        <div style={{ marginBottom: "1.25rem" }}>
          <Alerte variante="erreur">
            Erreur de chargement : {(erreurChantiers ?? erreurPointages)?.message}
          </Alerte>
        </div>
      )}

      <form action={enregistrerArrivee} style={{ ...styleCarte, display: "grid", gap: "1rem", padding: "1.25rem", marginBottom: "2rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>Chantier</span>
          <SelectChantier chantiers={chantiers ?? []} chantierIdInitial="" langue="fr" />
        </label>
        <input type="hidden" name="latitude" />
        <input type="hidden" name="longitude" />
        <input type="hidden" name="precision_metres" />
        <BoutonArrivee style={styleBoutonPrimaire} />
      </form>

      <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem" }}>Pointages d&rsquo;aujourd&rsquo;hui</h2>

      {pointages && pointages.length > 0 ? (
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {pointages.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
                background: couleurs.fond,
                border: `1px solid ${couleurs.bordureDouce}`,
                borderRadius: rayon.petit,
                boxShadow: ombre.legere,
                padding: "0.65rem 0.85rem",
              }}
            >
              <div>
                <strong>{heureBelge(p.horodatage)}</strong>{" "}
                <span style={{ color: couleurs.texteAttenue }}>
                  {(p.chantiers as unknown as { nom: string } | null)?.nom ?? "?"}
                </span>
                {p.latitude == null && (
                  <span style={{ display: "block", fontSize: "0.75rem", color: couleurs.avertissement }}>
                    Position indisponible
                  </span>
                )}
              </div>
              <form action={supprimerPointage}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  aria-label="Supprimer ce pointage"
                  style={{
                    minHeight: 36,
                    minWidth: 36,
                    borderRadius: 8,
                    border: `1.5px solid ${couleurs.bordure}`,
                    background: couleurs.fond,
                    color: couleurs.erreur,
                    fontSize: "0.9rem",
                  }}
                >
                  ✕
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: couleurs.texteAttenue, marginBottom: "1.5rem" }}>
          Pointe ton arrivée sur le premier chantier de la journée.
        </p>
      )}

      {pointages && pointages.length > 0 && (
        <Link
          href="/pointage/recap"
          style={{ ...styleBoutonSecondaire, display: "block", textAlign: "center", textDecoration: "none" }}
        >
          Clôturer la journée
        </Link>
      )}
    </main>
  );
}
