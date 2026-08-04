import { Alert, Platform } from "react-native";

// react-native-web (0.21) implémente Alert.alert comme un no-op total
// (`static alert() {}`), donc tous les messages d'erreur/succès étaient
// silencieusement avalés sur le web (ex : l'inscription qui "ne fait rien"
// au clic). Sur web on retombe sur window.alert ; sur natif, Alert.alert
// fonctionne normalement.
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
