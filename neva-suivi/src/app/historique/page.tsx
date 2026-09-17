import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateDuJourBelge } from "@/lib/date";
import { Logo } from "@/components/Logo";
import { couleurs, styleBoutonSecondaire } from "@/lib/ui";

const MOIS_REGEX = /^\d{4}-\d{2}$/;

function moisActuel(): string {
  return dateDuJourBelge().slice(0, 7);
}

function moisValide(mois: string | undefined): string {
  return mois && MOIS_REGEX.test(mois) ? mois : moisActuel();
}

// Toutes les bornes sont calculées en UTC à partir des seuls composants
// année/mois : aucune conversion de fuseau n'entre en jeu, on manipule des
// dates civiles (YYYY-MM-DD), pas des instants.
function limitesMois(mois: string): { debut: string; finExclusive: string } {
  const [annee, m] = mois.split("-").map(Number);
  const debut = `${mois}-01`;
  const finExclusive = new Date(Date.UTC(annee, m, 1)).toISOString().slice(0, 10);
  return { debut, finExclusive };
}

function decalerMois(mois: string, delta: number): string {
  const [annee, m] = mois.split("-").map(Number);
  return new Date(Date.UTC(annee, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

function libelleMois(mois: string): string {
  const [annee, m] = mois.split("-").map(Number);
  const date = new Date(Date.UTC(annee, m - 1, 1));
  const libelle = new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    date
  );
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

function libelleJour(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const libelle = new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(d);
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

// Même règle que public.within_correction_window() côté base (fenêtre de
// correction technicien de 7 jours glissants, cahier §2/§4).
function estModifiable(date: string, aujourdHui: string): boolean {
  const diffJours = (Date.parse(aujourdHui) - Date.parse(date)) / 86_400_000;
  return diffJours <= 7;
}

type Saisie = {
  id: string;
  date: string;
  heures: number | string;
  description: string | null;
  materiel: string | null;
  chantiers: { nom: string } | null;
};

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { mois: moisParam } = await searchParams;
  const mois = moisValide(moisParam);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profil } = await supabase.from("users").select("nom").eq("id", user.id).single();

  const { debut, finExclusive } = limitesMois(mois);
  const aujourdHui = dateDuJourBelge();

  // "Ses propres saisies" (cahier) : filtré explicitement par user_id même
  // si un admin passe ici — cette page reste personnelle, l'historique de
  // toute l'équipe est du ressort du back-office (/admin/saisies).
  const { data, error } = await supabase
    .from("saisies")
    .select("id, date, heures, description, materiel, chantiers(nom)")
    .eq("user_id", user.id)
    .gte("date", debut)
    .lt("date", finExclusive)
    .order("date", { ascending: false })
    .order("created_at", { ascending: true });

  const saisies = (data ?? []) as unknown as Saisie[];
  const totalMois = saisies.reduce((somme, s) => somme + Number(s.heures), 0);

  const groupes: { date: string; saisies: Saisie[] }[] = [];
  for (const s of saisies) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.date === s.date) {
      dernier.saisies.push(s);
    } else {
      groupes.push({ date: s.date, saisies: [s] });
    }
  }

  const peutAvancer = mois < moisActuel();

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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Logo hauteur={40} />
          <div>
            <h1 style={{ fontSize: "1.05rem", margin: 0 }}>Historique</h1>
            {profil && (
              <p style={{ margin: 0, color: couleurs.texteAttenue, fontSize: "0.9rem" }}>{profil.nom}</p>
            )}
          </div>
        </div>
        <Link
          href="/saisie"
          style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
        >
          Saisie
        </Link>
      </header>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <Link
          href={`/historique?mois=${decalerMois(mois, -1)}`}
          style={{ ...styleBoutonSecondaire, minHeight: 44, padding: "0 0.9rem" }}
          aria-label="Mois précédent"
        >
          ◀
        </Link>
        <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>{libelleMois(mois)}</span>
        {peutAvancer ? (
          <Link
            href={`/historique?mois=${decalerMois(mois, 1)}`}
            style={{ ...styleBoutonSecondaire, minHeight: 44, padding: "0 0.9rem" }}
            aria-label="Mois suivant"
          >
            ▶
          </Link>
        ) : (
          <span
            aria-hidden
            style={{
              ...styleBoutonSecondaire,
              minHeight: 44,
              padding: "0 0.9rem",
              opacity: 0.35,
              borderColor: couleurs.bordure,
              color: couleurs.bordure,
            }}
          >
            ▶
          </span>
        )}
      </div>

      {error && (
        <p
          style={{
            color: couleurs.erreur,
            background: couleurs.erreurFond,
            border: `1.5px solid ${couleurs.erreur}`,
            borderRadius: 8,
            padding: "0.75rem",
          }}
        >
          Impossible de charger l&apos;historique : {error.message}
        </p>
      )}

      <div
        style={{
          background: couleurs.primaire,
          color: couleurs.primaireTexte,
          borderRadius: 8,
          padding: "0.85rem 1rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontWeight: 600 }}>Total du mois</span>
        <span style={{ fontSize: "1.3rem", fontWeight: 700 }}>{totalMois.toFixed(2)} h</span>
      </div>

      {groupes.length === 0 && !error && (
        <p style={{ color: couleurs.texteAttenue }}>Aucune saisie ce mois-ci.</p>
      )}

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {groupes.map((groupe) => {
          const totalJour = groupe.saisies.reduce((somme, s) => somme + Number(s.heures), 0);
          return (
            <div key={groupe.date}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "0.5rem",
                }}
              >
                <h2 style={{ fontSize: "0.95rem", margin: 0 }}>{libelleJour(groupe.date)}</h2>
                <span style={{ fontSize: "0.9rem", color: couleurs.texteAttenue, fontWeight: 600 }}>
                  {totalJour.toFixed(2)} h
                </span>
              </div>

              <div style={{ display: "grid", gap: "0.6rem" }}>
                {groupe.saisies.map((s) => {
                  const modifiable = estModifiable(s.date, aujourdHui);
                  return (
                    <div
                      key={s.id}
                      style={{
                        border: `1.5px solid ${couleurs.bordure}`,
                        borderLeftWidth: 4,
                        borderLeftColor: modifiable ? couleurs.primaire : couleurs.bordure,
                        borderRadius: 8,
                        padding: "0.75rem 0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                        <strong>{s.chantiers?.nom ?? "—"}</strong>
                        <span style={{ fontWeight: 700 }}>{Number(s.heures).toFixed(2)} h</span>
                      </div>
                      {s.description && (
                        <p style={{ margin: "0.35rem 0 0", color: couleurs.texteAttenue, fontSize: "0.9rem" }}>
                          {s.description}
                        </p>
                      )}
                      {s.materiel && (
                        <p style={{ margin: "0.25rem 0 0", color: couleurs.texteAttenue, fontSize: "0.85rem" }}>
                          Matériel : {s.materiel}
                        </p>
                      )}
                      {modifiable && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "0.5rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: couleurs.primaire,
                            border: `1.5px solid ${couleurs.primaire}`,
                            borderRadius: 999,
                            padding: "0.1rem 0.55rem",
                          }}
                        >
                          Modifiable
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
