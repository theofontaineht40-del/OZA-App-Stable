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
import { Colors } from "../constants/colors";
import { registerUser } from "../services/auth";
import { showAlert } from "../utils/alert";

const PINK = Colors.primary;

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
        placeholderTextColor={Colors.textSecondary}
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Nom"
        placeholderTextColor={Colors.textSecondary}
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Adresse e-mail"
        placeholderTextColor={Colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor={Colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        placeholderTextColor={Colors.textSecondary}
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 35,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },

  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: Colors.text,
  },

  roleContainer: {
    flexDirection: "row",
    marginBottom: 28,
  },

  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 5,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },

  roleButtonActive: {
    borderColor: PINK,
    backgroundColor: Colors.accentTint,
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
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
    color: Colors.white,
    fontWeight: "700",
    fontSize: 18,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },

  footerText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },

  loginText: {
    color: PINK,
    fontWeight: "700",
    fontSize: 15,
  },
});