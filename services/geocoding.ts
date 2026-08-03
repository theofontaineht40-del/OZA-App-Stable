// Géocodage gratuit, sans clé API, via la Base Adresse Nationale (data.gouv.fr).
// Convertit un nom de ville en coordonnées pour l'affichage sur la carte
// Découvrir. Résultats mis en cache en mémoire pour éviter les appels
// répétés sur une même session (plusieurs coachs peuvent partager une ville).

export type Coordinates = { lat: number; lng: number };

const cache = new Map<string, Coordinates | null>();

export async function geocodeVille(ville: string): Promise<Coordinates | null> {
  const key = ville.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(key)}&type=municipality&limit=1`
    );
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) {
      cache.set(key, null);
      return null;
    }

    const [lng, lat] = feature.geometry.coordinates;
    const coords = { lat, lng };
    cache.set(key, coords);
    return coords;
  } catch {
    return null;
  }
}
