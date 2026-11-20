import { Ionicons } from "@expo/vector-icons";
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

import { Type } from "../constants/tokens";
import AnimatedPressable from "../components/animated-pressable";
import GradientFill from "../components/gradient-fill";
import PhotoBackground from "../components/photo-background";
import { Colors } from "../constants/colors";
import { registerUser } from "../services/auth";
import { showAlert } from "../utils/alert";
import { friendlyAuthError } from "../utils/firebase-errors";

const TEAL = Colors.primary;

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
    } catch (error) {
      showAlert("Erreur", friendlyAuthError(error));
    }
  }

  return (
    <View style={{ flex: 1 }}>
    <PhotoBackground />
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <View style={styles.logoRow}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
            tintColor={Colors.primaryDark}
          />
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
        {(
          [
            { key: "sportif", icon: "fitness-outline", title: "Sportif", sub: "Je suis suivi par un coach" },
            { key: "coach", icon: "trophy-outline", title: "Coach", sub: "J'accompagne des sportifs" },
          ] as const
        ).map((r) => {
          const active = role === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, active && styles.roleCardActive]}
              onPress={() => setRole(r.key)}
              activeOpacity={0.85}
            >
              <Ionicons name={r.icon} size={24} color={active ? Colors.primary : Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleCardTitle, active && styles.roleTextActive]}>{r.title}</Text>
                <Text style={styles.roleCardSub}>{r.sub}</Text>
              </View>
              <View style={[styles.roleCheck, active && styles.roleCheckActive]}>
                {active && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <AnimatedPressable
        style={styles.button}
        onPress={handleRegister}
      >
        <GradientFill />
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
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },

  logoRow: {
    marginBottom: 18,
    alignItems: "center",
  },

  logo: {
    height: 90,
    width: 150,
    
  },

  title: {
    fontFamily: Type.heading,
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
    borderRadius: 16,
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
    gap: 12,
    marginBottom: 28,
  },

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
  },

  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accentTint,
  },

  roleCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  roleCardSub: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  roleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grayMedium,
    alignItems: "center",
    justifyContent: "center",
  },

  roleCheckActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    borderColor: TEAL,
    backgroundColor: Colors.accentTint,
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },

  roleTextActive: {
    color: TEAL,
  },

  button: {
    overflow: "hidden",
    backgroundColor: TEAL,
    height: 58,
    borderRadius: 29,
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
    color: Colors.canard,
    fontWeight: "700",
    fontSize: 15,
  },
});