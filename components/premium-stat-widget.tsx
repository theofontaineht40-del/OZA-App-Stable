import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { Colors } from "../constants/colors";
import AnimatedPressable from "./animated-pressable";

const AUTO_ADVANCE_MS = 3000;
const TRANSITION_OUT_MS = 200;
const TRANSITION_IN_MS = 260;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const STREAK_ACCENT = "#FF9F0A";

type StateKey = "seances" | "temps" | "objectif" | "streak";

type Props = {
  weeklySessionCount: number;
  weeklyMinutes: number;
  goalProgress: number | null;
  streak: number;
  onAddSeance: () => void;
  onViewActivity: () => void;
  onViewGoal: () => void;
  onContinueStreak: () => void;
};

const THEME: Record<StateKey, { gradient: [string, string]; accent: string }> = {
  seances: { gradient: ["#E8F8F3", "#FCFBF7"], accent: Colors.primary },
  temps: { gradient: ["#E8F8F3", "#FCFBF7"], accent: Colors.primary },
  objectif: { gradient: ["#E8F8F3", "#FCFBF7"], accent: Colors.primary },
  streak: { gradient: ["#FFF0E2", "#FCFBF7"], accent: STREAK_ACCENT },
};

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function stopPropagation(e: GestureResponderEvent) {
  e.stopPropagation();
}

export default function PremiumStatWidget({
  weeklySessionCount,
  weeklyMinutes,
  goalProgress,
  streak,
  onAddSeance,
  onViewActivity,
  onViewGoal,
  onContinueStreak,
}: Props) {
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const states: {
    key: StateKey;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    caption: string;
    cta: string;
    onPress: () => void;
  }[] = [
    {
      key: "seances",
      icon: "trophy-outline",
      label: "SÉANCES",
      value: `${weeklySessionCount} séance${weeklySessionCount > 1 ? "s" : ""}`,
      caption: "cette semaine",
      cta: "+ Ajouter une séance",
      onPress: onAddSeance,
    },
    {
      key: "temps",
      icon: "time-outline",
      label: "TEMPS",
      value: formatDuration(weeklyMinutes),
      caption: "temps total cette semaine",
      cta: "Voir mon activité",
      onPress: onViewActivity,
    },
    {
      key: "objectif",
      icon: "flag-outline",
      label: "OBJECTIF",
      value: goalProgress !== null ? `${Math.round(goalProgress * 100)}%` : "—",
      caption: "de l'objectif hebdomadaire",
      cta: "Voir mon objectif",
      onPress: onViewGoal,
    },
    {
      key: "streak",
      icon: "flame-outline",
      label: "STREAK",
      value: `${streak} jour${streak > 1 ? "s" : ""}`,
      caption: "série en cours",
      cta: "Continuer ma série",
      onPress: onContinueStreak,
    },
  ];

  function scheduleNext() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      goTo((indexRef.current + 1) % states.length);
    }, AUTO_ADVANCE_MS);
  }

  function goTo(next: number) {
    if (next === indexRef.current) {
      scheduleNext();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: TRANSITION_OUT_MS, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -10, duration: TRANSITION_OUT_MS, useNativeDriver: true }),
    ]).start(() => {
      indexRef.current = next;
      setIndex(next);
      translateX.setValue(10);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: TRANSITION_IN_MS, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: TRANSITION_IN_MS, useNativeDriver: true }),
      ]).start();
    });
    scheduleNext();
  }

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = states[index];
  const theme = THEME[current.key];

  return (
    <AnimatedPressable style={styles.container} onPress={() => goTo((indexRef.current + 1) % states.length)}>
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <CardMotif variant={current.key} accent={theme.accent} />

      <Animated.View style={[styles.content, { opacity, transform: [{ translateX }] }]}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${theme.accent}1F` }]}>
            <Ionicons name={current.icon} size={18} color={theme.accent} />
          </View>
          <Text style={styles.eyebrow}>{current.label}</Text>
        </View>

        <View style={styles.valueRow}>
          <View style={styles.valueCol}>
            <Text style={styles.value} numberOfLines={1}>
              {current.value}
            </Text>
            <Text style={styles.caption} numberOfLines={1}>
              {current.caption}
            </Text>
            {current.key === "streak" && <StreakDots streak={streak} />}
          </View>
          {current.key === "objectif" && <RingProgress progress={goalProgress ?? 0} accent={theme.accent} />}
        </View>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: `${theme.accent}1F` }]}
          activeOpacity={0.7}
          onPress={(e) => {
            stopPropagation(e);
            current.onPress();
          }}
        >
          <Text style={[styles.ctaText, { color: current.key === "streak" ? "#C2570A" : Colors.primaryDark }]}>
            {current.cta}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.accent} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.dotsRow}>
        {states.map((s, i) => (
          <TouchableOpacity
            key={s.key}
            hitSlop={8}
            onPress={(e) => {
              stopPropagation(e);
              goTo(i);
            }}
          >
            <View style={[styles.dot, i === index && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </AnimatedPressable>
  );
}

function RingProgress({ progress, accent }: { progress: number; accent: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.ringWrap}>
      <Svg width={64} height={64}>
        <Circle cx={32} cy={32} r={RING_RADIUS} stroke={Colors.grayLight} strokeWidth={6} fill="none" />
        <Circle
          cx={32}
          cy={32}
          r={RING_RADIUS}
          stroke={accent}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${RING_CIRCUMFERENCE}`}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - clamped)}
          rotation={-90}
          origin="32,32"
        />
      </Svg>
      <View style={styles.ringLabelWrap} pointerEvents="none">
        <Text style={styles.ringLabel}>{Math.round(clamped * 100)}%</Text>
      </View>
    </View>
  );
}

function StreakDots({ streak }: { streak: number }) {
  const filled = Math.min(streak, 7);
  return (
    <View style={styles.streakDotsWrap}>
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={[styles.streakDot, i < filled && styles.streakDotActive]} />
      ))}
    </View>
  );
}

// Motifs abstraits (pas d'illustration figurative) rappelant chaque état,
// dans l'esprit des textures vectorielles déjà utilisées ailleurs dans l'app
// (components/decor.tsx) : lignes/formes fines à faible opacité, en fond.
function CardMotif({ variant, accent }: { variant: StateKey; accent: string }) {
  return (
    <View style={styles.motif} pointerEvents="none">
      <Svg width={150} height={110} viewBox="0 0 150 110">
        {variant === "seances" && (
          <Path
            d="M0,95 L28,68 L52,80 L82,38 L150,10"
            stroke={accent}
            strokeOpacity={0.22}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {variant === "temps" && (
          <>
            <Rect x="24" y="62" width="11" height="32" rx="3" fill={accent} fillOpacity={0.12} />
            <Rect x="46" y="46" width="11" height="48" rx="3" fill={accent} fillOpacity={0.16} />
            <Rect x="68" y="24" width="11" height="70" rx="3" fill={accent} fillOpacity={0.22} />
            <Rect x="90" y="40" width="11" height="54" rx="3" fill={accent} fillOpacity={0.14} />
          </>
        )}
        {variant === "objectif" && (
          <Path
            d="M6,92 Q78,100 144,18"
            stroke={accent}
            strokeOpacity={0.18}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {variant === "streak" && (
          <>
            <Path
              d="M0,98 L28,74 L52,82 L82,40 L150,12"
              stroke={accent}
              strokeOpacity={0.25}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="28" cy="74" r="4" fill={accent} fillOpacity={0.35} />
            <Circle cx="52" cy="82" r="4" fill={accent} fillOpacity={0.35} />
            <Circle cx="82" cy="40" r="4" fill={accent} fillOpacity={0.35} />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
    minHeight: 172,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  motif: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  valueCol: {
    flexShrink: 1,
  },

  value: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
  },

  caption: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  ringWrap: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },

  ringLabelWrap: {
    position: "absolute",
  },

  ringLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },

  streakDotsWrap: {
    flexDirection: "row",
    gap: 5,
    marginTop: 10,
  },

  streakDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.grayLight,
  },

  streakDotActive: {
    backgroundColor: STREAK_ACCENT,
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },

  ctaText: {
    fontSize: 13,
    fontWeight: "700",
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 14,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.grayMedium,
  },

  dotActive: {
    backgroundColor: Colors.primaryLight,
    width: 16,
  },
});
