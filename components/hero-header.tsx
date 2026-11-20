import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { Gradients } from "../constants/colors";

// Bandeau d'en-tête turquoise des accueils (maquette OZA) : wordmark en haut,
// salutation en blanc, actions à droite. Pleine largeur : il compense le
// padding de l'écran avec des marges négatives.
export default function HeroHeader({
  title,
  subtitle,
  right,
  horizontalPadding = 24,
  topPadding = 70,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  horizontalPadding?: number;
  topPadding?: number;
}) {
  return (
    <LinearGradient
      colors={Gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.hero,
        {
          marginHorizontal: -horizontalPadding,
          marginTop: -topPadding,
          paddingTop: topPadding - 8,
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          tintColor="#FFFFFF"
        />
        <View style={styles.actions}>{right}</View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 44,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: -20,
    zIndex: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  logo: {
    width: 74,
    height: 28,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
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
