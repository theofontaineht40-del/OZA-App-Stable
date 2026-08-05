export type Sexe = "H" | "F";

export const SEXES: { key: Sexe; label: string }[] = [
  { key: "H", label: "Homme" },
  { key: "F", label: "Femme" },
];

export type AgeBracket = "moins_18" | "18_35" | "35_plus";

export const AGE_BRACKETS: { key: AgeBracket; label: string }[] = [
  { key: "moins_18", label: "Moins de 18 ans" },
  { key: "18_35", label: "18-35 ans" },
  { key: "35_plus", label: "35 ans et +" },
];

export function segmentKey(sexe: string, ageBracket: string, sport: string): string {
  return `${sexe}__${ageBracket}__${sport}`;
}
