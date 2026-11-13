import AsyncStorage from "@react-native-async-storage/async-storage";

// Favoris et récents du sélecteur d'exercices : des conforts propres à chaque
// appareil (pas de synchro), donc stockés localement. Tout est tolérant aux
// échecs de stockage : le sélecteur marche très bien sans.
const FAVORITES_KEY = "oza.exercises.favorites";
const RECENTS_KEY = "oza.exercises.recents";
const MAX_RECENTS = 12;

async function readList(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

async function writeList(key: string, list: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignoré
  }
}

export function getFavoriteIds(): Promise<string[]> {
  return readList(FAVORITES_KEY);
}

export async function saveFavoriteIds(ids: string[]): Promise<void> {
  await writeList(FAVORITES_KEY, ids);
}

export function getRecentIds(): Promise<string[]> {
  return readList(RECENTS_KEY);
}

// Les plus récents d'abord, sans doublon, plafonné.
export function mergeRecents(current: string[], used: string[]): string[] {
  const fresh = [...used].reverse();
  return [...fresh, ...current.filter((id) => !fresh.includes(id))].slice(0, MAX_RECENTS);
}

export async function rememberUsed(used: string[]): Promise<string[]> {
  const next = mergeRecents(await getRecentIds(), used);
  await writeList(RECENTS_KEY, next);
  return next;
}
