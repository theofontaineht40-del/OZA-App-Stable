// Direction artistique "sport premium data" — teal profond + crème, dans la
// lignée Whoop / Apple Fitness : fond clair et cartes blanches pour l'usage
// quotidien (stats, programmes, messages), grandes cartes/écrans teal foncé
// réservés aux moments "hero" (connexion, bien-être du jour, navigation).
//
// `text`/`textSecondary` sont calibrés pour du texte sombre sur fond clair
// (le cas par défaut de tout l'app). Les quelques écrans/cartes qui restent
// teal foncé (auth, nav bar, hero cards) utilisent explicitement
// `textOnDark`/`textOnDarkSecondary` plutôt que `text`, pas d'inversion
// automatique.
//
// `background` est une couleur unie (pas transparente) : react-native-screens
// n'est pas actif sur l'export web de ce projet, donc le bottom-tabs
// d'expo-router ne fait que superposer les écrans (zIndex -1/0) sans les
// démonter ni les masquer réellement — seul un fond opaque sur l'écran actif
// empêche de voir les autres onglets en transparence derrière lui.
// <AppBackground /> (dégradé + halo, app/_layout.tsx) reste utilisé pour les
// écrans hors onglets (login/register/accueil) qui n'ont pas ce problème
// d'empilement.
export const Colors = {
  primary: "#14B8A6",
  primaryDark: "#0B2E2D",
  primaryLight: "#5EEAD4",
  // Alias de `primary` : plus de rose OZA comme accent séparé, le teal est
  // la seule couleur de marque désormais.
  accent: "#14B8A6",
  black: "#0B1F1E",
  white: "#FFFFFF",
  background: "#F6F4EE",
  navBackground: "#0C2E2D",
  surface: "#FFFFFF",
  surfaceAlt: "#F0EDE4",
  accentTint: "#E1F5F0",
  grayLight: "#EFEDE6",
  grayMedium: "rgba(11, 31, 30, 0.16)",
  text: "#101C1B",
  textSecondary: "rgba(16, 28, 27, 0.60)",
  // Texte/icônes posés sur une surface teal foncé (auth, nav bar, hero
  // cards) — jamais utilisés sur les fonds clairs par défaut.
  textOnDark: "#FFFFFF",
  textOnDarkSecondary: "rgba(255, 255, 255, 0.72)",
  border: "rgba(11, 31, 30, 0.10)",
  riskUnder: "#0A84FF",
  riskLow: "#34C759",
  riskMedium: "#FF9F0A",
  riskHigh: "#FF3B30",
};

// Fond d'écran partagé (voir components/app-background.tsx) : teal profond
// avec un halo lumineux subtil, pour les écrans hors onglets (login/register).
export const Gradients = {
  app: ["#0B2E2D", "#146B62", "#0B2E2D"] as const,
};
