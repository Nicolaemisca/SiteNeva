// Géocodage via Nominatim (OpenStreetMap) : pas de clé API à gérer pour ce
// volume (quelques chantiers créés/modifiés à la fois). Cahier §5.1 : le GPS
// n'est jamais saisi à la main, uniquement déduit de l'adresse côté
// back-office — et son échec ne doit jamais empêcher d'enregistrer le
// chantier (cahier §7 "GPS ... jamais bloquant").
export async function geocoderAdresse(
  adresse: string
): Promise<{ latitude: number; longitude: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", adresse);

  try {
    const reponse = await fetch(url, {
      headers: {
        // Exigé par la politique d'usage de Nominatim (identification du client).
        "User-Agent": "NevaEnergySuivi/1.0 (info@neva-energy.be)",
      },
    });

    if (!reponse.ok) return null;

    const resultats = (await reponse.json()) as Array<{ lat: string; lon: string }>;
    const premier = resultats[0];
    if (!premier) return null;

    const latitude = Number(premier.lat);
    const longitude = Number(premier.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}
