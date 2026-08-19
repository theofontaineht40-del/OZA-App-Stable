// Direction artistique "sport premium data" — bleu électrique + blanc +
// glassmorphism. `white`/`black` restent des couleurs littérales fixes
// (texte/icônes sur l'accent, qui reste vif quel que soit le thème) ;
// `background`/`surface`/`text`/`border` etc. sont les tokens sémantiques
// qui portent le thème.
//
// `background` est un bleu uni (pas transparent) : react-native-screens
// n'est pas actif sur l'export web de ce projet, donc le bottom-tabs
// d'expo-router ne fait que superposer les écrans (zIndex -1/0) sans les
// démonter ni les masquer réellement — seul un fond opaque sur l'écran
// actif empêche de voir les autres onglets en transparence derrière lui.
// <AppBackground /> (dégradé + halos, app/_layout.tsx) reste utilisé pour
// les écrans hors onglets (login/register/accueil) qui n'ont pas ce
// problème d'empilement.
export const Colors = {
  primary: "#3B82F6",
  primaryDark: "#0B2A66",
  primaryLight: "#60A5FA",
  // Rose OZA : accent de marque (logo, quelques indicateurs), jamais la
  // couleur dominante — le bleu reste dominant partout ailleurs.
  accent: "#FF1674",
  black: "#020B1F",
  white: "#F5F7FA",
  background: "#061634",
  navBackground: "rgba(2, 11, 31, 0.85)",
  // Verre dépoli clair (blanc, pas teinté navy) à opacité plus soutenue :
  // un blanc à 10% se fondait complètement dans les photos de fond, mais un
  // verre trop sombre/teinté ne se distinguait plus non plus — il faut du
  // blanc, juste plus opaque qu'au départ, pour que le widget reste clair.
  surface: "rgba(255, 255, 255, 0.18)",
  surfaceAlt: "rgba(255, 255, 255, 0.28)",
  accentTint: "rgba(59, 130, 246, 0.22)",
  grayLight: "rgba(255, 255, 255, 0.14)",
  grayMedium: "rgba(255, 255, 255, 0.30)",
  text: "#F5F7FA",
  textSecondary: "rgba(245, 247, 250, 0.72)",
  border: "rgba(255, 255, 255, 0.30)",
  riskUnder: "#0A84FF",
  riskLow: "#34C759",
  riskMedium: "#FF9F0A",
  riskHigh: "#FF3B30",
};

// Fond d'écran partagé (voir components/app-background.tsx) : bleu nuit →
// bleu électrique → bleu profond, avec quelques halos très subtils.
export const Gradients = {
  app: ["#020B1F", "#2563EB", "#061634"] as const,
};
