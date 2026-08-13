import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity } from "react-native";

import { Colors } from "../constants/colors";
import { NewMessageEvent } from "../hooks/use-unread-conversations";

type Props = {
  event: NewMessageEvent | null;
  onPress: (otherId: string) => void;
};

// Petit "ding" via Web Audio API : suffisant pour le web (surface principale
// testée) sans tirer de dépendance audio native pour un simple bip.
function playDing() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Environnement sans audio autorisé (première interaction manquante) : silencieux.
  }
}

export default function MessageToast({ event, onPress }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!event) return;

    playDing();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9 }).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }).start();
    }, 4000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [event]);

  if (!event) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.toast}
        activeOpacity={0.9}
        onPress={() => {
          Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }).start();
          onPress(event.otherId);
        }}
      >
        <Text style={styles.name} numberOfLines={1}>
          💬 {event.name}
        </Text>
        <Text style={styles.text} numberOfLines={1}>
          {event.text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "web" ? 16 : 54,
    paddingHorizontal: 16,
    zIndex: 999,
    alignItems: "center",
  },

  toast: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  name: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 14,
  },

  text: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
