import { Stack } from "expo-router";

// Pile de navigation dédiée au détail d'un programme : sans elle,
// l'écran d'exécution de séance était un tab frère à plat dans le Tabs
// du sportif, et "Retour" revenait au dernier onglet visité (Accueil)
// plutôt qu'au détail du programme.
export default function ProgrammeDetailLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
