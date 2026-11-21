import { Image, StyleSheet, View } from "react-native";

// Disque OZA 3D : élément signature de la marque (image fournie, détourée
// dans assets/images/oza-disc.png). Un seul composant pour tous les écrans afin
// de garder exactement le même rendu : connexion, accueil public, et plus tard
// niveaux / récompenses.
export default function OzaDisc({ size = 300, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        glow && styles.glow,
      ]}
    >
      <Image
        source={require("../assets/images/oza-disc.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowColor: "#12C9B8",
    shadowOpacity: 0.45,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
});
