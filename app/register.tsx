import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AnimatedPressable from "../components/animated-pressable";
import { registerUser } from "../services/auth";
import { showAlert } from "../utils/alert";

const PINK = "#FF2D7A";

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"coach" | "sportif">("sportif");

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  }, []);

  async function handleRegister() {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      showAlert("Erreur", "Merci de remplir tous les champs.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await registerUser(
        firstName,
        lastName,
        email,
        password,
        role
      );

      showAlert("Succès", "Compte créé avec succès.");

      router.replace("/login");
    } catch (error: any) {
      showAlert("Erreur", error.message);
    }
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <View style={styles.logoRow}>
          <Image source={require("../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Créer un compte</Text>

        <Text style={styles.subtitle}>
          Rejoignez la communauté OZA.
        </Text>

      <TextInput
        style={styles.input}
        placeholder="Prénom"
        placeholderTextColor={"#666"}
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Nom"
        placeholderTextColor={"#666"}
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Adresse e-mail"
        placeholderTextColor={"#666"}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor={"#666"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        placeholderTextColor={"#666"}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Text style={styles.roleTitle}>Je suis :</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "sportif" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("sportif")}
        >
          <Text
            style={[
              styles.roleText,
              role === "sportif" && styles.roleTextActive,
            ]}
          >
            🏃 Sportif
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "coach" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("coach")}
        >
          <Text
            style={[
              styles.roleText,
              role === "coach" && styles.roleTextActive,
            ]}
          >
            🏋️ Coach
          </Text>
        </TouchableOpacity>
      </View>

      <AnimatedPressable
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Créer mon compte</Text>
      </AnimatedPressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Déjà un compte ?
        </Text>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.loginText}> Se connecter</Text>
        </TouchableOpacity>
      </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },

  logoRow: {
    marginBottom: 20,
    alignItems: "center",
  },

  logo: {
    height: 200,
    width: 184,
    
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 35,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },

  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111",
  },

  roleContainer: {
    flexDirection: "row",
    marginBottom: 28,
  },

  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 5,
    alignItems: "center",
  },

  roleButtonActive: {
    borderColor: PINK,
    backgroundColor: "#FFF1F7",
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  roleTextActive: {
    color: PINK,
  },

  button: {
    backgroundColor: PINK,
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 18,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },

  footerText: {
    color: "#666",
    fontSize: 15,
  },

  loginText: {
    color: PINK,
    fontWeight: "700",
    fontSize: 15,
  },
});