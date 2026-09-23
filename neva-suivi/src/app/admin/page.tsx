import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateDuJourBelge } from "@/lib/date";
import { couleurs, ombre, PALETTE_CATEGORIELLE, rayon, styleCarte } from "@/lib/ui";

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

  // Heures par chantier (cahier consigne 18) : cumul TOUT l'historique, pas
  // seulement le mois affiché plus haut — "voir où va le temps" n'a pas de
  // fenêtre glissante, contrairement au calendrier de présence qui lui est
  // mensuel par nature.
  const { data: chantiersActifs, error: erreurChantiers } = await supabase
    .from("chantiers")
    .select("id, nom")
    .eq("statut", "actif")
    .order("nom");

  const idsChantiersActifs = (chantiersActifs ?? []).map((c) => c.id);
  const { data: saisiesChantiers } = idsChantiersActifs.length
    ? await supabase.from("saisies").select("chantier_id, user_id, heures").in("chantier_id", idsChantiersActifs)
    : { data: [] as { chantier_id: string; user_id: string; heures: number }[] };

  type RepartitionChantier = { total: number; parUtilisateur: Map<string, number> };
  const heuresParChantier = new Map<string, RepartitionChantier>();
  for (const s of saisiesChantiers ?? []) {
    const entree = heuresParChantier.get(s.chantier_id) ?? { total: 0, parUtilisateur: new Map<string, number>() };
    entree.total += Number(s.heures);
    entree.parUtilisateur.set(s.user_id, (entree.parUtilisateur.get(s.user_id) ?? 0) + Number(s.heures));
    heuresParChantier.set(s.chantier_id, entree);
  }

  const nomParUtilisateur = new Map((utilisateurs ?? []).map((u) => [u.id, u.nom]));

  // Chantier le plus chronophage en premier : plus utile ici que l'ordre
  // alphabétique (déjà utilisé partout ailleurs, ex. sélecteurs de saisie).
  const chantiersTries = [...(chantiersActifs ?? [])].sort(
    (a, b) => (heuresParChantier.get(b.id)?.total ?? 0) - (heuresParChantier.get(a.id)?.total ?? 0)
  );

  return (
    <main>
      <h1 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>Tableau de bord</h1>

      {error && (
        <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
          {error.message}
        </p>
      )}

      {/* Deux colonnes sur grand écran (PC), empilées sur petit écran (gsm) :
          auto-fit + minmax fait le travail sans media query à maintenir. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
      <section style={{ ...styleCarte, padding: "1.25rem" }}>
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

      <section style={{ ...styleCarte, padding: "1.25rem" }}>
        <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem" }}>Heures par chantier</h2>

        {erreurChantiers && (
          <p style={{ color: couleurs.erreur, background: couleurs.erreurFond, border: `1.5px solid ${couleurs.erreur}`, borderRadius: 8, padding: "0.75rem" }}>
            {erreurChantiers.message}
          </p>
        )}

        {chantiersTries.length === 0 && <p style={{ color: couleurs.texteAttenue }}>Aucun chantier actif.</p>}

        <div style={{ display: "grid", gap: "1rem" }}>
          {chantiersTries.map((c) => {
            const repartition = heuresParChantier.get(c.id);
            const total = repartition?.total ?? 0;
            const parUtilisateur = [...(repartition?.parUtilisateur ?? new Map())]
              .map(([userId, heures]) => ({ userId, nom: nomParUtilisateur.get(userId) ?? "?", heures }))
              .sort((a, b) => b.heures - a.heures);

            return (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
                  <Link href={`/admin/saisies?chantier_id=${c.id}`} style={{ color: couleurs.texte, fontWeight: 600, textDecoration: "none" }}>
                    {c.nom}
                  </Link>
                  <strong>{total.toFixed(2)} h</strong>
                </div>

                {total > 0 ? (
                  <>
                    <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: couleurs.fondPage }}>
                      {parUtilisateur.map((p) => (
                        <div
                          key={p.userId}
                          title={`${p.nom} : ${p.heures.toFixed(2)} h`}
                          style={{
                            width: `${(p.heures / total) * 100}%`,
                            background: couleurParUtilisateur.get(p.userId) ?? couleurs.bordure,
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 0.85rem", marginTop: "0.4rem" }}>
                      {parUtilisateur.map((p) => (
                        <span key={p.userId} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: couleurs.texteAttenue }}>
                          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: couleurParUtilisateur.get(p.userId) ?? couleurs.bordure, flexShrink: 0 }} />
                          {p.nom} — {p.heures.toFixed(2)} h
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.8rem", color: couleurs.texteAttenue }}>Aucune heure enregistrée.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
      </div>
    </main>
  );
}
