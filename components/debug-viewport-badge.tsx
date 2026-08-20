import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

// TEMPORAIRE — diagnostic de l'écart persistant sous la barre de nav sur
// certains iPhone. Affiche les mesures réelles de l'écran pour comparer
// avec ce qu'on attend, à retirer une fois le bug identifié.
export default function DebugViewportBadge() {
  const [info, setInfo] = useState<string>("...");

  useEffect(() => {
    if (Platform.OS !== "web") return;
    function measure() {
      const root = document.getElementById("root");
      const rootRect = root?.getBoundingClientRect();
      const nav = Array.from(document.querySelectorAll("div")).find(
        (el) =>
          el.textContent?.includes("Accueil") &&
          el.textContent?.includes("Profil") &&
          el.getBoundingClientRect().height < 150 &&
          el.getBoundingClientRect().height > 20
      );
      const navRect = nav?.getBoundingClientRect();
      const cs = getComputedStyle(document.documentElement);
      setInfo(
        [
          `innerH: ${window.innerHeight}`,
          `visualVP: ${Math.round(window.visualViewport?.height ?? -1)}`,
          `rootH: ${Math.round(rootRect?.height ?? -1)}`,
          `rootBottom: ${Math.round(rootRect?.bottom ?? -1)}`,
          `navBottom: ${Math.round(navRect?.bottom ?? -1)}`,
          `navTop: ${Math.round(navRect?.top ?? -1)}`,
          `dpr: ${window.devicePixelRatio}`,
        ].join(" | ")
      );
    }
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    const interval = setInterval(measure, 1000);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      clearInterval(interval);
    };
  }, []);

  if (Platform.OS !== "web") return null;

  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.text}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 60,
    left: 8,
    right: 8,
    backgroundColor: "rgba(255, 0, 0, 0.85)",
    borderRadius: 8,
    padding: 6,
    zIndex: 9999,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
