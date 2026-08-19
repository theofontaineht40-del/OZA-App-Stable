import { ImageBackground, StyleSheet, View } from "react-native";

// Fonds abstraits fournis par le coach (pas générés, pas remplacés), un par
// grande section de l'app : "accueil", "programmes", "seances", "profil".
// Un voile noir léger garde le texte lisible par-dessus les zones les plus
// lumineuses (halos teal) sans écraser l'image.
const SOURCES = {
  accueil: require("../assets/images/bg-accueil.png"),
  programmes: require("../assets/images/bg-programmes.png"),
  seances: require("../assets/images/bg-seances.png"),
  profil: require("../assets/images/bg-profil.png"),
};

type Variant = keyof typeof SOURCES;

export default function PhotoBackground({ variant }: { variant: Variant }) {
  return (
    <ImageBackground
      source={SOURCES[variant]}
      style={[styles.fill, { pointerEvents: "none" }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
  },
});
