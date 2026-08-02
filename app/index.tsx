import { router } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.subtitle}>
        La plateforme qui connecte les sportifs aux meilleurs coachs.
      </Text>

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
    </View>
  );
}

const PINK = "#FF2D7A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  logo: {
    width: 500,
    height: 300,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 40,
  },

  subtitle: {
    fontSize: 16,
    color: "#9A9A9A",
    lineHeight: 24,
    marginTop: -120,
    marginBottom: 140,
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: PINK,
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    marginTop: -40,
  },

  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },

  secondaryButton: {
    height: 58,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: PINK,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: PINK,
    fontWeight: "700",
    fontSize: 18,
  },
});