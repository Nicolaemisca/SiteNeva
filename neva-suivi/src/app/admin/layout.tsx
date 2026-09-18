import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { signOut } from "@/app/actions/auth";
import { couleurs, styleBoutonSecondaire } from "@/lib/ui";

// Garde d'accès unique pour tout /admin/* : les pages filles n'ont plus à
// revérifier le rôle, seulement le layout (rendu avant elles dans le même
// arbre — un redirect ici empêche le rendu des enfants). Les server actions
// (chantiers.ts) restent leur propre point d'entrée et se protègent elles
// mêmes, un appel de formulaire ne passant pas par ce layout.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profil } = await requireAdmin();

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "1rem 1rem 1rem 1.5rem",
          borderBottom: `1.5px solid ${couleurs.bordure}`,
        }}
      >
        <nav style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/admin/chantiers" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Chantiers
          </Link>
          <Link href="/admin/saisies" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Saisies
          </Link>
          <Link href="/admin/utilisateurs" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Utilisateurs
          </Link>
          <Link href="/saisie" style={{ ...styleBoutonSecondaire, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Ma saisie
          </Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.9rem", color: couleurs.texteAttenue }}>{profil.nom}</span>
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
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          paddingTop: "1.5rem",
          paddingBottom: "1.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}
