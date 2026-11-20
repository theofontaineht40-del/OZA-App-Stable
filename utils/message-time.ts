// Heure du dernier message façon messagerie : « 10:42 » aujourd'hui, « Hier »,
// sinon « 12 oct. ». Chaîne vide si on n'a pas de date.
export function messageTimeLabel(lastMessageAt: unknown): string {
  const ms = (lastMessageAt as { toMillis?: () => number } | null)?.toMillis?.();
  if (!ms) return "";
  const date = new Date(ms);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
