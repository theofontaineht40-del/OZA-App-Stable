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

  return (
    <View style={{ flex: 1 }}>
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
            tintColor={Colors.white}
          />
          <Text style={styles.tagline}>OPTIMAL ZONE FOR ATHLETES</Text>

          <Animated.View style={{ transform: [{ translateY: floatY }], marginVertical: 28, alignSelf: "center" }}>
            <OzaDisc size={250} />
          </Animated.View>

          <AnimatedPressable style={styles.primaryButton} onPress={() => router.push("/login")}>
            <GradientFill />
            <Text style={styles.primaryText}>Se connecter</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.secondaryButton} onPress={() => router.push("/register")}>
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
    alignSelf: "center",
    width: 300,
    height: 120,
  },

  tagline: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
    textAlign: "center",
  },

  primaryButton: {
    overflow: "hidden",
    height: 58,
    borderRadius: 29,
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
