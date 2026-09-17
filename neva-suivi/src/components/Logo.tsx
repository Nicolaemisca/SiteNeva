import Image from "next/image";

// width/height = dimensions réelles du fichier (public/logo.png,
// 4079x2128) : c'est ce que next/image utilise pour réserver la place au
// premier rendu (élimine le décalage de mise en page). La taille affichée
// est ensuite fixée en CSS avec l'autre axe sur "auto", pour que le
// navigateur conserve le ratio exact plutôt qu'un calcul arrondi côté JS.
const HAUTEUR_DEFAUT = 40;

export function Logo({ hauteur = HAUTEUR_DEFAUT }: { hauteur?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Neva Energy"
      width={4079}
      height={2128}
      priority
      style={{ height: hauteur, width: "auto" }}
    />
  );
}
