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
  // Palette officielle (cahier des charges UI/UX) :
  //  bleu pétrole #062D2B · vert canard #075B57 · turquoise foncé #087F78 ·
  //  turquoise principal #12C9B8 · vert d'eau #8BEDE0 · blanc cassé #F7FAFA ·
  //  gris clair #EAF1F1. Répartition ~60 % clair / 30 % pétrole-canard / 10 %
  //  turquoise vif. Aucun orange.
  primary: "#087F78", // boutons, états actifs, éléments sélectionnés
  primaryDark: "#062D2B", // fonds sombres, navigation, contraste
  primaryLight: "#8BEDE0", // surbrillance et détails doux
  accent: "#087F78",
  black: "#062D2B",
  white: "#FFFFFF",
  background: "#F7FAFA",
  navBackground: "#062D2B",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF4F4",
  accentTint: "#E3F7F4",
  grayLight: "#EAF1F1",
  grayMedium: "rgba(6, 45, 43, 0.16)",
  text: "#0B1F1E",
  textSecondary: "rgba(11, 31, 30, 0.62)",
  // Texte/icônes posés sur une surface sombre (auth, nav bar, hero cards).
  textOnDark: "#FFFFFF",
  textOnDarkSecondary: "rgba(255, 255, 255, 0.74)",
  border: "#EAF1F1",
  canard: "#075B57", // vert canard : surfaces secondaires, dégradés
  turquoise: "#12C9B8", // accents, graphiques, progression
  riskUnder: "#0A84FF",
  riskLow: "#12C9B8",
  // Pas d'orange dans la charte : la vigilance passe en jaune doré.
  riskMedium: "#E0B000",
  riskHigh: "#E5484D",
};

// Fond d'écran partagé (voir components/app-background.tsx) : teal profond
// avec un halo lumineux subtil, pour les écrans hors onglets (login/register).
export const Gradients = {
  app: ["#062D2B", "#075B57", "#062D2B"] as const,
  // Boutons principaux : dégradé turquoise.
  cta: ["#12C9B8", "#087F78"] as const,
  // Bandeau d'en-tête des accueils.
  hero: ["#075B57", "#0E9A8E", "#12C9B8"] as const,
};
