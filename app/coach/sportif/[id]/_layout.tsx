import { Stack } from "expo-router";

// Pile de navigation dédiée à la fiche d'un sportif : sans elle, ces
// écrans étaient des tabs frères à plat dans le Tabs du coach, et
// "Retour" revenait au dernier onglet visité (Accueil) plutôt qu'à
// l'écran précédent (ex. profil médical → retour → fiche du sportif).
export default function SportifDetailLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
