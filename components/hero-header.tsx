import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Type } from "../constants/tokens";
import { Gradients } from "../constants/colors";

// Bandeau d'en-tête turquoise des accueils (maquette OZA) : wordmark en haut,
// salutation en blanc, actions à droite. Pleine largeur : il compense le
// padding de l'écran avec des marges négatives.
export default function HeroHeader({
  title,
  subtitle,
  right,
  bleedX = 24,
  bleedTop = 70,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  // Marges négatives qui compensent le padding de l'écran parent.
  bleedX?: number;
  bleedTop?: number;
}) {
  return (
    <LinearGradient
      colors={Gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.hero,
        {
          marginHorizontal: -bleedX,
          marginTop: -bleedTop,
          paddingTop: 62,
          paddingHorizontal: 24,
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* logo.png a de larges marges transparentes : on le recadre sur le mot. */}
        <View style={styles.logoClip}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
            tintColor="#FFFFFF"
          />
        </View>
        <View style={styles.actions}>{right}</View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 48,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: -22,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  logoClip: {
    width: 104,
    height: 36,
    overflow: "hidden",
  },
  logo: {
    position: "absolute",
    width: 300,
    height: 120,
    left: -98,
    top: -42,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: Type.heading,
    fontSize: 27,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14.5,
    color: "rgba(255,255,255,0.86)",
    marginTop: 4,
  },
});

// Bouton rond translucide pour les actions du bandeau (cloche, profil...).
export function HeroIconButton({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity style={iconStyles.button} onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

const iconStyles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
