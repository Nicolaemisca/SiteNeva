import Image from "next/image";
import Link from "next/link";

// width/height = dimensions réelles du fichier (public/logo.png,
// 4079x2128) : c'est ce que next/image utilise pour réserver la place au
// premier rendu (élimine le décalage de mise en page). La taille affichée
// est ensuite fixée en CSS avec l'autre axe sur "auto", pour que le
// navigateur conserve le ratio exact plutôt qu'un calcul arrondi côté JS.
const HAUTEUR_DEFAUT = 40;

// `lien` fait du logo un raccourci "accueil" cliquable dans les en-têtes
// (ex. /saisie) — omis sur /login où il n'y a pas encore de session, donc
// pas de "chez soi" vers lequel revenir.
export function Logo({
  hauteur = HAUTEUR_DEFAUT,
  lien,
  libelleLien,
}: {
  hauteur?: number;
  lien?: string;
  libelleLien?: string;
}) {
  const image = (
    <Image
      src="/logo.png"
      alt="Neva Energy"
      width={4079}
      height={2128}
      priority
      style={{ height: hauteur, width: "auto" }}
    />
  );

  if (!lien) return image;

  return (
    <Link href={lien} aria-label={libelleLien} style={{ display: "inline-flex", lineHeight: 0 }}>
      {image}
    </Link>
  );
}
