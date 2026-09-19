import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { modifierLangue } from "@/app/actions/profil";
import { Logo } from "@/components/Logo";
import { couleurs, styleBoutonPrimaire, styleBoutonSecondaire, styleChamp } from "@/lib/ui";
import { dictionnaires, estLangueValide, LANGUES } from "@/lib/i18n/dictionnaires";

const styleEtiquette = { fontWeight: 600, color: couleurs.texte } as const;

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ enregistre?: string; erreur?: string }>;
}) {
  const { enregistre, erreur } = await searchParams;
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
          <h1 style={{ fontSize: "1.05rem", margin: 0 }}>{t.profilPage.titre}</h1>
        </div>
        <Link
          href="/saisie"
          style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
        >
          {t.nav.saisie}
        </Link>
      </header>

      {enregistre && (
        <p
          style={{
            color: couleurs.succes,
            background: couleurs.succesFond,
            border: `1.5px solid ${couleurs.succes}`,
            borderRadius: 8,
            padding: "0.75rem",
            fontWeight: 600,
            marginBottom: "1.25rem",
          }}
        >
          {t.profilPage.langueEnregistree}
        </p>
      )}

      {erreur && (
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
          {erreur}
        </p>
      )}

      <div style={{ display: "grid", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.profilPage.nom}</span>
          <span>{profil?.nom ?? "—"}</span>
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.profilPage.email}</span>
          <span>{user.email}</span>
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.profilPage.role}</span>
          <span>{profil?.role === "admin" ? t.profilPage.roleAdmin : t.profilPage.roleTechnicien}</span>
        </div>
      </div>

      <form action={modifierLangue} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={styleEtiquette}>{t.profilPage.langue}</span>
          <select name="langue" defaultValue={langue} style={styleChamp}>
            {LANGUES.map((l) => (
              <option key={l.valeur} value={l.valeur}>
                {l.libelle}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" style={styleBoutonPrimaire}>
          {t.profilPage.enregistrer}
        </button>
      </form>
    </main>
  );
}
