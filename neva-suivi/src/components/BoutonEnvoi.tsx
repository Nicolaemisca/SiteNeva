"use client";

import { useFormStatus } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

// Retour visuel pendant l'envoi (useFormStatus lit l'état du <form> parent) :
// sans ça, un réseau mobile lent donne l'impression qu'un tap sur "Se
// connecter"/"Enregistrer" n'a rien fait, alors que la requête est juste en
// cours — cause probable d'un signalement "rien ne se passe" en production.
export function BoutonEnvoi({
  style,
  texteEnCours,
  children,
}: {
  style: CSSProperties;
  texteEnCours: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} style={{ ...style, opacity: pending ? 0.7 : 1 }}>
      {pending ? texteEnCours : children}
    </button>
  );
}
