import { ImageBackground, StyleSheet, View } from "react-native";

// Deux vraies photos fournies par le coach (pas générées, pas remplacées) :
// - "gym" pour les écrans liés à l'entraînement (accueil, programme, séance).
// - "texture" pour les écrans plus premium/sobres (connexion, profil).
// Un voile bleu nuit semi-transparent garde le texte et les widgets
// glassmorphism lisibles par-dessus, sans dénaturer la photo.
const SOURCES = {
  gym: require("../assets/images/bg-gym.png"),
  texture: require("../assets/images/bg-texture.jpg"),
};

export default function PhotoBackground({ variant }: { variant: "gym" | "texture" }) {
  return (
    <ImageBackground
      source={SOURCES[variant]}
      style={[styles.fill, { pointerEvents: "none" }]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, variant === "gym" ? styles.overlayGym : styles.overlayTexture]} />
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
  },

  // La photo de salle est déjà très sombre — un voile léger suffit à garder
  // le contraste des textes sans l'écraser.
  overlayGym: {
    backgroundColor: "rgba(2, 11, 31, 0.55)",
  },

  // La texture carbone est plus claire par endroits (reflet en bas à
  // gauche) : voile un peu plus marqué pour une lisibilité constante.
  overlayTexture: {
    backgroundColor: "rgba(2, 11, 31, 0.72)",
  },
});
