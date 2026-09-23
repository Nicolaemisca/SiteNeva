import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { cloturerPointage } from "@/app/actions/pointage";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { dateDuJourBelge } from "@/lib/date";
import { calculerRecapPointage, type PointageBrut } from "@/lib/recapPointage";
import { couleurs, rayon, styleBoutonPrimaire, styleBoutonSecondaire, styleCarte } from "@/lib/ui";

// L'heure de clôture est figée ICI, au rendu de l'aperçu — et transmise à
// l'action via un champ caché — pour que le total affiché et le total
// enregistré portent sur exactement le même calcul (cahier consigne 15 :
// "récapitulatif à vérifier avant enregistrement" implique que ce qu'on
// vérifie soit ce qui s'enregistre, pas un total qui aurait dérivé entre les
// deux si l'admin met du temps à relire).
export default async function RecapPointagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireAdmin();
  const date = dateDuJourBelge();
  const cloture = new Date();

  const { data: pointages } = await supabase
    .from("pointages")
    .select("chantier_id, horodatage, chantiers(nom)")
    .eq("user_id", user.id)
    .eq("date", date)
    .order("horodatage", { ascending: true });

  if (!pointages || pointages.length === 0) {
    redirect("/pointage");
  }

  const brut: PointageBrut[] = pointages.map((p) => ({
    chantierId: p.chantier_id as string,
    chantierNom: (p.chantiers as unknown as { nom: string } | null)?.nom ?? "",
    horodatage: p.horodatage as string,
  }));

  const recap = calculerRecapPointage(brut, cloture);
  const total = Math.round(recap.reduce((s, l) => s + l.heures, 0) * 100) / 100;

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        paddingTop: "1.5rem",
        paddingBottom: "3rem",
        paddingLeft: "1.5rem",
        paddingRight: "1rem",
        fontFamily: "var(--font-sans), sans-serif",
        color: couleurs.texte,
        background: couleurs.fondPage,
      }}
    >
      <h1 style={{ fontSize: "1.1rem", marginTop: 0 }}>Récapitulatif de la journée</h1>
      <p style={{ color: couleurs.texteAttenue }}>
        Calculé à partir de tes pointages jusqu&rsquo;à maintenant (
        {cloture.toLocaleTimeString("fr-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" })}
        ). Rien n&rsquo;est enregistré tant que tu n&rsquo;as pas confirmé.
      </p>

      {params.erreur && (
        <p
          style={{
            color: couleurs.erreur,
            background: couleurs.erreurFond,
            border: `1.5px solid ${couleurs.erreur}`,
            borderRadius: 8,
            padding: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {params.erreur}
        </p>
      )}

      {recap.length === 0 ? (
        <p style={{ color: couleurs.avertissement }}>
          Durée nulle sur tous les chantiers pointés — rien à enregistrer.
        </p>
      ) : (
        <div style={{ ...styleCarte, padding: "1rem", display: "grid", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {recap.map((ligne) => (
            <div
              key={ligne.chantierId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: couleurs.fondPage,
                borderRadius: rayon.petit,
                padding: "0.65rem 0.85rem",
              }}
            >
              <span>{ligne.chantierNom}</span>
              <strong>{ligne.heures.toFixed(2)} h</strong>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.5rem 0.85rem",
              fontWeight: 700,
              color: couleurs.primaire,
              borderTop: `1px solid ${couleurs.bordureDouce}`,
              marginTop: "0.25rem",
              paddingTop: "0.75rem",
            }}
          >
            <span>Total</span>
            <span>{total.toFixed(2)} h</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {recap.length > 0 && (
          <form action={cloturerPointage}>
            <input type="hidden" name="cloture" value={cloture.toISOString()} />
            <BoutonEnvoi style={{ ...styleBoutonPrimaire, width: "100%" }} texteEnCours="Enregistrement…">
              Confirmer et enregistrer les heures
            </BoutonEnvoi>
          </form>
        )}
        <Link
          href="/pointage"
          style={{ ...styleBoutonSecondaire, display: "block", textAlign: "center", textDecoration: "none" }}
        >
          Retour sans enregistrer
        </Link>
      </div>
    </main>
  );
}
