import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AnimatedPressable from "../components/animated-pressable";
import { Colors } from "../constants/colors";

const VALUE_PROPS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}[] = [
  {
    icon: "barbell-outline",
    title: "Programmes sur mesure",
    text: "Votre coach construit vos séances bloc par bloc, exercice par exercice, et les ajuste séance après séance.",
  },
  {
    icon: "trending-up-outline",
    title: "Charge et progression suivies",
    text: "Poids soulevé, ressenti d'effort, risque de surcharge : tout est suivi pour progresser sans se blesser.",
  },
  {
    icon: "chatbubbles-outline",
    title: "Coach et sportif connectés",
    text: "Messagerie, réservations de séances, retours en direct après chaque entraînement — au même endroit.",
  },
];

export default function WelcomeScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <Animated.Image
          source={require("../assets/images/logo.png")}
          style={[styles.logo, { transform: [{ translateY: floatY }] }]}
          resizeMode="contain"
          tintColor={Colors.white}
        />

        <Text style={styles.headline}>L'entraînement, piloté intelligemment.</Text>
        <Text style={styles.subtitle}>
          OZA connecte les sportifs à leur coach, et transforme chaque séance en
          données utiles pour progresser — sans se blesser.
        </Text>

        <View style={styles.valuePropsList}>
          {VALUE_PROPS.map((item) => (
            <View key={item.title} style={styles.valuePropRow}>
              <View style={styles.valuePropIconWrap}>
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <View style={styles.valuePropTextWrap}>
                <Text style={styles.valuePropTitle}>{item.title}</Text>
                <Text style={styles.valuePropText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <AnimatedPressable
          style={styles.primaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryText}>Se connecter</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={styles.secondaryButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.secondaryText}>Créer un compte</Text>
        </AnimatedPressable>
      </Animated.View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },

  logo: {
    width: 220,
    height: 130,
    alignSelf: "center",
    marginBottom: 8,
  },

  headline: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textOnDark,
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textOnDarkSecondary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },

  valuePropsList: {
    gap: 20,
    marginBottom: 36,
  },

  valuePropRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  valuePropIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentTint,
    justifyContent: "center",
    alignItems: "center",
  },

  valuePropTextWrap: {
    flex: 1,
  },

  valuePropTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginBottom: 3,
  },

  valuePropText: {
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
    lineHeight: 19,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  primaryText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 18,
  },

  secondaryButton: {
    height: 58,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 18,
  },
});
