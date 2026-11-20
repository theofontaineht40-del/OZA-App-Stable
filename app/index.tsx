import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import AnimatedPressable from "../components/animated-pressable";
import GradientFill from "../components/gradient-fill";
import OzaDisc from "../components/oza-disc";
import { Colors } from "../constants/colors";

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

  const { width, height } = useWindowDimensions();
  const discSize = Math.min(width * 0.86, height * 0.42, 340);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#2FC9B4", "#0F8176", "#0A4D47", "#062E2B"]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.column, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={styles.top}>
            <Text style={styles.wordmark}>OZA</Text>
            <Text style={styles.tagline}>OPTIMAL ZONE FOR ATHLETES</Text>
          </View>

          <Animated.View style={{ transform: [{ translateY: floatY }], alignSelf: "center" }}>
            <OzaDisc size={discSize} />
          </Animated.View>

          <View style={styles.buttons}>
            <AnimatedPressable style={styles.primaryButton} onPress={() => router.push("/login")}>
              <GradientFill colors={["#35F0D8", "#0FB8A4"]} />
              <Text style={styles.primaryText}>Se connecter</Text>
            </AnimatedPressable>

            <AnimatedPressable style={styles.secondaryButton} onPress={() => router.push("/register")}>
              <Text style={styles.secondaryText}>Créer un compte</Text>
            </AnimatedPressable>
          </View>
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
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 36,
  },

  column: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    justifyContent: "space-between",
    gap: 24,
  },

  top: {
    alignItems: "center",
  },

  wordmark: {
    fontSize: 92,
    lineHeight: 100,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 2,
    color: Colors.white,
    textShadowColor: "rgba(4, 38, 34, 0.45)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 14,
  },

  tagline: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3.2,
    color: "rgba(255,255,255,0.88)",
    marginTop: 2,
    textAlign: "center",
  },

  buttons: {
    gap: 14,
  },

  primaryButton: {
    overflow: "hidden",
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },

  primaryText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 18,
  },

  secondaryButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: Colors.primaryDark,
    fontWeight: "700",
    fontSize: 18,
  },
});
