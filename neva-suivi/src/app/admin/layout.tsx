import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { signOut } from "@/app/actions/auth";
import { couleurs, ombre, styleBoutonSecondaire } from "@/lib/ui";

// Garde d'accès unique pour tout /admin/* : les pages filles n'ont plus à
// revérifier le rôle, seulement le layout (rendu avant elles dans le même
// arbre — un redirect ici empêche le rendu des enfants). Les server actions
// (chantiers.ts) restent leur propre point d'entrée et se protègent elles
// mêmes, un appel de formulaire ne passant pas par ce layout.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profil } = await requireAdmin();

  return (
    <div style={{ fontFamily: "var(--font-sans), sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "1rem 1rem 1rem 1.5rem",
          background: couleurs.fond,
          boxShadow: ombre.legere,
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        {/* Défilement horizontal plutôt qu'un retour à la ligne sur petit
            écran (cahier : "adapté au gsm") — plus lisible que plusieurs
            rangées de boutons empilées sur un téléphone étroit. */}
        <nav style={{ display: "flex", gap: "0.5rem", overflowX: "auto", WebkitOverflowScrolling: "touch", flex: "1 1 auto", minWidth: 0 }}>
          <Link href="/admin" style={{ ...styleBoutonSecondaire, flexShrink: 0, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Tableau de bord
          </Link>
          <Link href="/admin/chantiers" style={{ ...styleBoutonSecondaire, flexShrink: 0, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Chantiers
          </Link>
          <Link href="/admin/saisies" style={{ ...styleBoutonSecondaire, flexShrink: 0, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Saisies
          </Link>
          <Link href="/admin/utilisateurs" style={{ ...styleBoutonSecondaire, flexShrink: 0, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Utilisateurs
          </Link>
          <Link href="/pointage" style={{ ...styleBoutonSecondaire, flexShrink: 0, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Pointage
          </Link>
          <Link href="/saisie" style={{ ...styleBoutonSecondaire, flexShrink: 0, minHeight: 40, padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}>
            Ma saisie
          </Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
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
