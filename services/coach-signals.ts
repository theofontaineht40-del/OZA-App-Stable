import { SportifRow } from "./coach-analytics";

// Signaux affichés en pastilles dans la liste des sportifs : ce qui demande
// l'attention du coach, déduit des données déjà calculées (bien-être, ACWR,
// planning) — rien d'inventé, chaque signal pointe une règle existante.
export type SignalTone = "ok" | "warn" | "alert";

export type Signal = { label: string; tone: SignalTone };

// Au-delà de ce nombre de jours sans check-in, on le signale.
export const HOOPER_STALE_DAYS = 3;

export function daysSince(dateIso: string, todayIso: string): number {
  const a = new Date(`${dateIso}T12:00:00`).getTime();
  const b = new Date(`${todayIso}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function computeSignals(row: SportifRow, today: string): Signal[] {
  const signals: Signal[] = [];

  if (!row.lastWellnessDate) {
    signals.push({ label: "aucun HOOPER", tone: "warn" });
  } else if (daysSince(row.lastWellnessDate, today) > HOOPER_STALE_DAYS) {
    signals.push({ label: "HOOPER non rempli", tone: "warn" });
  }

  // L'ACWR n'alerte qu'avec assez d'historique (voir buildSportifRow : sinon
  // acwrLevel vaut déjà "optimale").
  if (row.acwrLevel === "danger") signals.push({ label: "charge à risque", tone: "alert" });
  else if (row.acwrLevel === "risque") signals.push({ label: "charge à risque", tone: "warn" });

  if (row.wellnessStatusValue === "red") {
    signals.push({ label: "récupération défavorable", tone: "alert" });
  } else if (row.wellnessStatusValue === "orange") {
    signals.push({ label: "récupération à surveiller", tone: "warn" });
  }

  if (row.lateCount > 0) {
    signals.push({
      label: `${row.lateCount} séance${row.lateCount > 1 ? "s" : ""} en retard`,
      tone: "warn",
    });
  }

  return signals.length > 0 ? signals : [{ label: "RAS", tone: "ok" }];
}

// "aujourd'hui", "hier", "il y a 5 j" — ou null sans donnée.
export function agoLabel(dateIso: string | null, today: string): string | null {
  if (!dateIso) return null;
  const d = daysSince(dateIso, today);
  if (d <= 0) return "aujourd'hui";
  if (d === 1) return "hier";
  return `il y a ${d} j`;
}

const ACWR_LABEL: Record<string, string> = {
  "sous-charge": "sous-charge",
  optimale: "optimale",
  risque: "à risque",
  danger: "danger",
};

export function acwrLabel(row: SportifRow): string {
  return ACWR_LABEL[row.acwrLevel] ?? "";
}

// ── Boîte « À traiter » de l'accueil coach ──

export type TriageItem = {
  uid: string;
  name: string;
  chips: Signal[];
  unreadMessage: boolean;
  // "alert" si au moins un signal fort, sinon "warn" : sert au tri et au liseré.
  severity: "alert" | "warn";
};

export type TriageInput = {
  rows: { uid: string; firstName: string; lastName: string; row: SportifRow }[];
  // uid des sportifs dont la conversation a un message non lu par le coach
  unreadSportifIds: Set<string>;
  // uid → gênes encore ouvertes (zone), possiblement vide
  openInjuries: Record<string, { zone: string; gravite: number }[]>;
  today: string;
};

// Un sportif apparaît s'il a au moins un signal autre que "RAS", un message à
// lire ou une gêne ouverte. Triés : signaux forts d'abord, puis par nombre de
// motifs, puis par nom — pour que le haut de la liste soit ce qui presse.
export function buildTriage(input: TriageInput): TriageItem[] {
  const items: TriageItem[] = [];
  for (const { uid, firstName, lastName, row } of input.rows) {
    const chips = computeSignals(row, input.today).filter((s) => s.tone !== "ok");

    const injuries = input.openInjuries[uid] ?? [];
    if (injuries.length > 0) {
      const strong = injuries.some((i) => i.gravite >= 7);
      chips.unshift({
        label: `gêne ouverte : ${injuries[0].zone}${injuries.length > 1 ? ` +${injuries.length - 1}` : ""}`,
        tone: strong ? "alert" : "warn",
      });
    }

    const unreadMessage = input.unreadSportifIds.has(uid);
    if (unreadMessage) chips.push({ label: "message non lu", tone: "warn" });

    if (chips.length === 0) continue;
    items.push({
      uid,
      name: `${firstName} ${lastName}`.trim(),
      chips,
      unreadMessage,
      severity: chips.some((c) => c.tone === "alert") ? "alert" : "warn",
    });
  }

  return items.sort(
    (a, b) =>
      Number(b.severity === "alert") - Number(a.severity === "alert") ||
      b.chips.length - a.chips.length ||
      a.name.localeCompare(b.name)
  );
}
