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
    // `right`/`bottom` seuls ne suffisent pas à étirer l'<img> sous-jacent
    // sur react-native-web au-delà de sa largeur naturelle (~850px, la
    // largeur des sources) — un fond restait donc coupé à mi-écran sur les
    // très larges viewports desktop. `width`/`height: 100%` forcent
    // l'étirement réel quelle que soit la largeur du conteneur.
    width: "100%",
    height: "100%",
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
