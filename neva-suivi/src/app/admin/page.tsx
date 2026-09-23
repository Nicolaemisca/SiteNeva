import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateDuJourBelge } from "@/lib/date";
import { couleurs, PALETTE_CATEGORIELLE } from "@/lib/ui";

const NOMS_JOURS = ["L", "M", "M", "J", "V", "S", "D"];

function moisValide(valeur: string | undefined): { annee: number; moisIndex0: number } {
  const parse = valeur && /^\d{4}-\d{2}$/.test(valeur) ? valeur : dateDuJourBelge().slice(0, 7);
  const [annee, mois] = parse.split("-").map(Number);
  return { annee, moisIndex0: mois - 1 };
}

function versParamMois(annee: number, moisIndex0: number): string {
  return `${annee}-${String(moisIndex0 + 1).padStart(2, "0")}`;
}

function versDateIso(annee: number, moisIndex0: number, jour: number): string {
  return `${annee}-${String(moisIndex0 + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

// Grille de semaines lundi->dimanche (convention belge), avec des cases
// vides avant le 1er et après le dernier jour du mois pour aligner les
// colonnes. Arithmétique en UTC : ce ne sont que des positions de calendrier,
// aucune conversion de fuseau n'entre en jeu (contrairement à date.ts).
function construireSemaines(annee: number, moisIndex0: number): (number | null)[][] {
  const premierJour = new Date(Date.UTC(annee, moisIndex0, 1));
  const nombreJours = new Date(Date.UTC(annee, moisIndex0 + 1, 0)).getUTCDate();
  const decalage = (premierJour.getUTCDay() + 6) % 7; // lundi = 0

  const jours: (number | null)[] = [...Array(decalage).fill(null)];
  for (let j = 1; j <= nombreJours; j++) jours.push(j);
  while (jours.length % 7 !== 0) jours.push(null);

  const semaines: (number | null)[][] = [];
  for (let i = 0; i < jours.length; i += 7) semaines.push(jours.slice(i, i + 7));
  return semaines;
}

// Dashboard admin (cahier consignes 16 et 18) : racine de /admin, jusqu'ici
// inexistante (le layout ne pointait que vers chantiers/saisies/utilisateurs).
export default async function DashboardAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { annee, moisIndex0 } = moisValide(params.mois);
  const aujourdHui = dateDuJourBelge();

  const supabase = await createClient();

  const { data: utilisateurs } = await supabase.from("users").select("id, nom, actif").order("nom");
  const nombreActifs = (utilisateurs ?? []).filter((u) => u.actif).length;
  const couleurParUtilisateur = new Map<string, string>();
  (utilisateurs ?? []).forEach((u, i) => {
    couleurParUtilisateur.set(u.id, PALETTE_CATEGORIELLE[i % PALETTE_CATEGORIELLE.length]);
  });

  const debutMois = versDateIso(annee, moisIndex0, 1);
  const finMois = versDateIso(annee, moisIndex0, new Date(Date.UTC(annee, moisIndex0 + 1, 0)).getUTCDate());

  const { data: saisiesMois, error } = await supabase
    .from("saisies")
    .select("date, user_id")
    .gte("date", debutMois)
    .lte("date", finMois);

  const parJour = new Map<string, string[]>();
  for (const s of saisiesMois ?? []) {
    const liste = parJour.get(s.date) ?? [];
    liste.push(s.user_id);
    parJour.set(s.date, liste);
  }

  const semaines = construireSemaines(annee, moisIndex0);
  const libelleMois = new Date(Date.UTC(annee, moisIndex0, 1)).toLocaleDateString("fr-BE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const { annee: anneePrec, moisIndex0: moisPrec } =
    moisIndex0 === 0 ? { annee: annee - 1, moisIndex0: 11 } : { annee, moisIndex0: moisIndex0 - 1 };
  const { annee: anneeSuiv, moisIndex0: moisSuiv } =
    moisIndex0 === 11 ? { annee: annee + 1, moisIndex0: 0 } : { annee, moisIndex0: moisIndex0 + 1 };

  return (
    <main>
      <h1 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>Tableau de bord</h1>

      {error && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
          {error.message}
        </p>
      )}

      <section
        style={{
          background: couleurs.fond,
          border: `1.5px solid ${couleurs.bordure}`,
          borderRadius: 8,
          padding: "1rem",
          maxWidth: 520,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <Link href={`/admin?mois=${versParamMois(anneePrec, moisPrec)}`} aria-label="Mois précédent" style={{ color: couleurs.primaire, fontWeight: 700, textDecoration: "none", padding: "0.25rem 0.5rem" }}>
            ‹
          </Link>
          <strong style={{ textTransform: "capitalize" }}>{libelleMois}</strong>
          <Link href={`/admin?mois=${versParamMois(anneeSuiv, moisSuiv)}`} aria-label="Mois suivant" style={{ color: couleurs.primaire, fontWeight: 700, textDecoration: "none", padding: "0.25rem 0.5rem" }}>
            ›
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
          {NOMS_JOURS.map((n, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: "0.75rem", color: couleurs.texteAttenue, fontWeight: 700 }}>
              {n}
            </div>
          ))}

          {semaines.flatMap((semaine, si) =>
            semaine.map((jour, ji) => {
              if (jour === null) return <div key={`${si}-${ji}`} />;

              const dateIso = versDateIso(annee, moisIndex0, jour);
              const idsJour = parJour.get(dateIso) ?? [];
              // Jours "attendus" seulement : pas le futur (rien à reprocher à
              // un jour pas encore arrivé), pas le dimanche (jamais travaillé
              // — cahier consigne 5, distinction samedi déjà établie, dimanche
              // jamais mentionné comme jour de chantier).
              const dateObj = new Date(Date.UTC(annee, moisIndex0, jour));
              const estAttendu = dateIso <= aujourdHui && dateObj.getUTCDay() !== 0;
              const enManque = estAttendu && nombreActifs > 0 && idsJour.length < nombreActifs;

              return (
                <Link
                  key={`${si}-${ji}`}
                  href={`/admin/saisies?du=${dateIso}&au=${dateIso}`}
                  title={
                    enManque
                      ? `${idsJour.length} saisie${idsJour.length > 1 ? "s" : ""} — ${nombreActifs} attendues d'habitude`
                      : `${idsJour.length} saisie${idsJour.length > 1 ? "s" : ""}`
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    minHeight: 52,
                    padding: "0.3rem 0.15rem",
                    borderRadius: 6,
                    border: enManque ? `1.5px solid ${couleurs.avertissement}` : "1.5px solid transparent",
                    background: enManque ? couleurs.avertissementFond : "transparent",
                    textDecoration: "none",
                    color: couleurs.texte,
                  }}
                >
                  <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.15rem" }}>
                    {jour}
                    {enManque && (
                      <span aria-hidden style={{ fontSize: "0.7rem" }}>
                        ⚠
                      </span>
                    )}
                  </span>
                  <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2px", maxWidth: 44 }}>
                    {idsJour.map((id, i) => (
                      <span
                        key={i}
                        aria-hidden
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: couleurParUtilisateur.get(id) ?? couleurs.bordure,
                        }}
                      />
                    ))}
                  </span>
                </Link>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: `1px solid ${couleurs.bordure}` }}>
          {(utilisateurs ?? []).map((u, i) => (
            <span key={u.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: u.actif ? couleurs.texte : couleurs.texteAttenue }}>
              <span
                aria-hidden
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: PALETTE_CATEGORIELLE[i % PALETTE_CATEGORIELLE.length],
                  flexShrink: 0,
                }}
              />
              {u.nom}
              {!u.actif && " (désactivé)"}
            </span>
          ))}
        </div>

        <p style={{ fontSize: "0.75rem", color: couleurs.texteAttenue, marginTop: "0.75rem", marginBottom: 0 }}>
          Encadré ⚠ : moins de saisies que d&rsquo;utilisateurs actifs ({nombreActifs}) ce jour-là. Clique un jour pour
          voir le détail.
        </p>
      </section>
    </main>
  );
}
