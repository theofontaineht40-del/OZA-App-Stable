export type MapPin = { lat: number; lng: number };

// Le géocodage des coachs est au niveau ville (services/geocoding.ts) : deux
// coachs dans la même ville obtiennent des coordonnées identiques, et leurs
// pins se superposent exactement sur la carte — un seul reste visible/
// cliquable, masquant les autres. On écarte légèrement les pins qui
// partagent les mêmes coordonnées, en cercle autour du point d'origine.
export function spreadOverlappingPins<T extends MapPin>(pins: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const pin of pins) {
    const key = `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}`;
    const group = groups.get(key);
    if (group) group.push(pin);
    else groups.set(key, [pin]);
  }

  const result: T[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const radius = 0.006; // ~600m, suffisant pour séparer les pins sans les éloigner de leur ville
    group.forEach((pin, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      result.push({
        ...pin,
        lat: pin.lat + radius * Math.cos(angle),
        lng: pin.lng + radius * Math.sin(angle),
      });
    });
  }
  return result;
}
