"use client";

import { useEffect, useState } from "react";
import { styleChamp } from "@/lib/ui";

type Chantier = {
  id: string;
  nom: string;
  client: string | null;
  latitude: number | null;
  longitude: number | null;
};

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const rayonTerre = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * rayonTerre * Math.asin(Math.sqrt(h));
}

// Rejette une position GPS inexploitable pour classer des chantiers : hors
// bornes, "null island" (0,0 — symptôme classique d'un capteur en échec) ou
// précision trop grossière pour départager des chantiers proches les uns des
// autres (cahier : "si aberrante, ordre alphabétique").
function positionValide(coords: GeolocationCoordinates): boolean {
  const { latitude, longitude, accuracy } = coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false;
  if (latitude === 0 && longitude === 0) return false;
  if (accuracy != null && accuracy > 50_000) return false;
  return true;
}

// Reçoit les chantiers déjà triés par nom (ordre par défaut, cahier : "sinon
// ordre alphabétique") et les retrie par distance dès qu'une position valide
// est disponible. Ne bloque jamais la saisie : le select est utilisable dès
// le rendu, avec l'ordre alphabétique, et se retrie silencieusement en tâche
// de fond si la géolocalisation aboutit.
export function SelectChantier({
  chantiers,
  chantierIdInitial,
}: {
  chantiers: Chantier[];
  chantierIdInitial: string;
}) {
  const [ordre, setOrdre] = useState(chantiers);
  const [chantierId, setChantierId] = useState(chantierIdInitial);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!positionValide(position.coords)) return;

        const ici = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        const avecGps = chantiers.filter((c) => c.latitude != null && c.longitude != null);
        const sansGps = chantiers.filter((c) => c.latitude == null || c.longitude == null);

        const tries = [...avecGps].sort(
          (a, b) =>
            distanceKm(ici, { latitude: a.latitude as number, longitude: a.longitude as number }) -
            distanceKm(ici, { latitude: b.latitude as number, longitude: b.longitude as number })
        );

        setOrdre([...tries, ...sansGps]);
      },
      () => {
        // Position indisponible, refusée ou expirée : on garde l'ordre
        // alphabétique déjà affiché.
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
    );
  }, [chantiers]);

  return (
    <select
      name="chantier_id"
      value={chantierId}
      onChange={(e) => setChantierId(e.target.value)}
      required
      autoFocus
      style={styleChamp}
    >
      <option value="" disabled>
        Choisir un chantier
      </option>
      {ordre.map((chantier) => (
        <option key={chantier.id} value={chantier.id}>
          {chantier.nom}
          {chantier.client ? ` — ${chantier.client}` : ""}
        </option>
      ))}
    </select>
  );
}
