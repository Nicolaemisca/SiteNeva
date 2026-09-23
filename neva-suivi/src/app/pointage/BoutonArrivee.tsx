"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";

function definirChamp(form: HTMLFormElement, nom: string, valeur: string) {
  const champ = form.elements.namedItem(nom);
  if (champ instanceof HTMLInputElement) champ.value = valeur;
}

// Capture la position juste avant l'envoi plutôt qu'en arrière-plan au
// chargement de la page (précision : on veut la position AU moment du geste
// d'arrivée, pas celle d'il y a cinq minutes). N'attend jamais indéfiniment
// le GPS : un refus, un échec ou un dépassement de délai soumet quand même
// le formulaire sans position — le pointage de l'heure ne doit jamais
// dépendre du succès du GPS (même principe que SelectChantier, cahier §7).
export function BoutonArrivee({ style }: { style: CSSProperties }) {
  const [enCours, setEnCours] = useState(false);

  function gererClic(e: MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    setEnCours(true);

    if (!("geolocation" in navigator)) {
      form.requestSubmit();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        definirChamp(form, "latitude", String(position.coords.latitude));
        definirChamp(form, "longitude", String(position.coords.longitude));
        definirChamp(form, "precision_metres", String(position.coords.accuracy));
        form.requestSubmit();
      },
      () => form.requestSubmit(),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  return (
    <button type="button" onClick={gererClic} disabled={enCours} style={{ ...style, opacity: enCours ? 0.7 : 1 }}>
      {enCours ? "Localisation…" : "J'arrive sur le chantier"}
    </button>
  );
}
