// Design tokens centralisés (cahier des charges UI/UX) : typographies, rayons,
// espacements et ombres. Les couleurs restent dans constants/colors.ts.

// Titres : police sportive épaisse et condensée (Oswald) ; textes courants :
// police système (SF Pro sur iOS, Inter/Roboto ailleurs).
export const Type = {
  heading: "Oswald_700Bold",
  headingSemi: "Oswald_600SemiBold",
} as const;

export const Radius = {
  sm: 12,
  md: 16, // cartes courantes (14–22 px selon le composant)
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Ombres très légères (la charte évite les ombres prononcées).
export const Shadow = {
  card: {
    shadowColor: "#062D2B",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: "#062D2B",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
