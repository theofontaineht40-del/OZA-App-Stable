import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { doc, getDoc } from "firebase/firestore";
import AnimatedPressable from "../components/animated-pressable";
import { Colors } from "../constants/colors";
import { db } from "../firebase";
import { loginUser } from "../services/auth";
import { showAlert } from "../utils/alert";

const TEAL = Colors.primary;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      showAlert("Erreur", "Merci de remplir tous les champs.");
      return;
    }

    try {
      const user = await loginUser(email, password);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        showAlert("Erreur", "Utilisateur introuvable.");
        return;
      }

      const data = userSnap.data();

      if (data.role === "coach") {
        router.push("/coach");
      } else {
        router.push("/sportif");
      }
    } catch (error: any) {
      showAlert("Erreur", error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <View style={styles.logoRow}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
            tintColor={Colors.white}
          />
        </View>

        <Text style={styles.title}>Connexion</Text>

        <Text style={styles.subtitle}>
          Bon retour sur OZA.
        </Text>

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

        <AnimatedPressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </AnimatedPressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pas encore de compte ?
          </Text>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.registerText}> Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 30,
  },

  logoRow: {
    marginBottom: 28,
    alignItems: "center",
  },

  logo: {
    height: 220,
    width: 184,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: Colors.textOnDarkSecondary,
    marginBottom: 35,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 18,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },

  button: {
    backgroundColor: TEAL,
    height: 58,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 18,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },

  footerText: {
    color: Colors.textOnDarkSecondary,
  },

  registerText: {
    color: Colors.primaryLight,
    fontWeight: "700",
  },
});
