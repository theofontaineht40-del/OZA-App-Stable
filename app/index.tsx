import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    text: "Poids soulevé, ressenti d'effort, risque de surcharge (ACWR) : tout est suivi pour progresser sans se blesser.",
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
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

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryText}>Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.secondaryText}>Créer un compte</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
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
    backgroundColor: "#FFF1F7",
    justifyContent: "center",
    alignItems: "center",
  },

  valuePropTextWrap: {
    flex: 1,
  },

  valuePropTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },

  valuePropText: {
    fontSize: 13,
    color: Colors.textSecondary,
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
