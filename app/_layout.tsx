import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppBackground from "../components/app-background";
import { Colors } from "../constants/colors";

SplashScreen.preventAutoHideAsync();

// Sans ThemeProvider explicite, Expo Router laisse React Navigation sur son
// thème clair par défaut (fond #F2F2F2 derrière chaque écran) — invisible
// avec l'ancien fond noir plein cadre, mais ça masquait complètement le
// dégradé de <AppBackground /> une fois les écrans passés en transparent.
const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "transparent",
    card: "transparent",
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

// @expo/vector-icons charge sa police via un effet interne à chaque icône,
// qui ne s'exécute jamais pendant le pré-rendu statique d'Expo Router
// (web.output "static") : le HTML exporté ne contient donc aucune règle
// @font-face, et les icônes s'affichent avec la police de repli (carrés)
// tant que le fallback interne n'a pas fini son délai. On précharge la
// police explicitement ici et on bloque le premier rendu jusqu'à ce
// qu'elle soit réellement chargée, sur toutes les plateformes.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <AppBackground />
        <ThemeProvider value={NavTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="coach" />
            <Stack.Screen name="sportif" />
          </Stack>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}
