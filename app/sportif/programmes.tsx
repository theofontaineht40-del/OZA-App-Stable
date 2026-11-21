import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Type } from "../../constants/tokens";
import AnimatedPressable from "../../components/animated-pressable";
import GradientFill from "../../components/gradient-fill";
import { ProgrammeIllustration } from "../../components/empty-illustrations";
import PhotoBackground from "../../components/photo-background";
import ExerciseThumb from "../../components/exercise-thumb";
import { Colors, Gradients } from "../../constants/colors";
import { ExerciseTemplate } from "../../constants/exercise-library";
import { MUSCLE_ID_LABELS } from "../../constants/muscle-selection";
import { getExerciseLibrary } from "../../services/exercises";
import { auth } from "../../firebase";
import { estimateSeanceMinutes, getProgrammesForSportif, Objectif, Programme } from "../../services/programmes";
import { getSessionsForSportif, SessionRecord } from "../../services/tracking";

export default function SportifProgrammesScreen() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [library, setLibrary] = useState<Map<string, ExerciseTemplate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Objectif | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const data = await getProgrammesForSportif(user.uid);
        setProgrammes(data);
        // Vignettes des exercices : un plus, la liste reste complète sans elles.
        if (data[0]?.coachId) {
          getExerciseLibrary(data[0].coachId)
            .then((list) => setLibrary(new Map(list.map((e) => [e.id, e]))))
            .catch(() => {});
        }
        // La progression est un plus : sans elle la liste reste complète.
        try {
          setSessions(await getSessionsForSportif(user.uid));
        } catch {
          setSessions([]);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [loading]);

  if (loading) {
    return <View style={styles.container} />;
  }

  // Onglets par objectif : seulement ceux que les programmes du sportif utilisent.
  const objectifs = Array.from(
    new Set(programmes.map((p) => p.objectif).filter((o): o is Objectif => o !== null))
  );
  const visible = programmes.filter((p) => tab === null || p.objectif === tab);
  // Progression d'un programme = séances différentes déjà réalisées / séances prévues.
  function progressOf(p: Programme): number {
    if (p.seances.length === 0) return 0;
    const done = new Set(
      sessions.filter((x) => x.programmeId === p.id && x.seanceId).map((x) => x.seanceId as string)
    );
    const count = p.seances.filter((se) => done.has(se.id)).length;
    return Math.min(1, count / p.seances.length);
  }
  function durationOf(p: Programme): string {
    const mins = p.seances.map(estimateSeanceMinutes).filter((m) => m > 0);
    if (mins.length === 0) return "";
    return `≈ ${Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)} min / séance`;
  }
  const featured = visible[0];
  const others = visible.slice(1);

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="accueil" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <Text style={styles.title}>Programmes</Text>

      {objectifs.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={{ gap: 8 }}
        >
          {([null, ...objectifs] as (Objectif | null)[]).map((o) => {
            const active = tab === o;
            return (
              <TouchableOpacity
                key={o ?? "tous"}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(o)}
              >
                {active && <GradientFill />}
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{o ?? "Tous"}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {programmes.length === 0 ? (
        <View style={styles.emptyCard}>
          <ProgrammeIllustration size={80} />
          <Text style={styles.emptyTitle}>Aucun programme assigné</Text>
          <Text style={styles.emptyText}>
            Votre coach ne vous a pas encore assigné de programme d'entraînement.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/sportif/messages")}>
            <Text style={styles.emptyButtonText}>Écrire à mon coach</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {featured && (
            <AnimatedPressable
              style={styles.heroCard}
              onPress={() => router.push(`/sportif/programme/${featured.id}`)}
            >
              <LinearGradient
                colors={Gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
              />
              <Text style={styles.heroEyebrow}>{featured.objectif ?? "Programme en cours"}</Text>
              <Text style={styles.heroTitle}>{featured.nom}</Text>
              <Text style={styles.heroMeta}>
                {featured.seances.length} séance{featured.seances.length > 1 ? "s" : ""}
                {durationOf(featured) ? ` · ${durationOf(featured)}` : ""}
              </Text>
              <View style={styles.heroTrack}>
                <View style={[styles.heroFill, { width: `${Math.round(progressOf(featured) * 100)}%` }]} />
              </View>
              <Text style={styles.heroPercent}>{Math.round(progressOf(featured) * 100)} % réalisé</Text>
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Ouvrir</Text>
                <Ionicons name="arrow-forward" size={15} color={Colors.primaryDark} />
              </View>
            </AnimatedPressable>
          )}
          {featured && featured.seances.length > 0 && (
            <View style={styles.seancesCard}>
              <Text style={styles.seancesTitle}>Séances du programme</Text>
              {featured.seances.map((se, i) => {
                const done = sessions.some((x) => x.programmeId === featured.id && x.seanceId === se.id);
                const firstEx = se.blocs.flatMap((b) => b.exercices)[0];
                const focus = (se.muscles ?? []).slice(0, 2).map((m) => MUSCLE_ID_LABELS[m]).join(", ");
                return (
                  <TouchableOpacity
                    key={se.id}
                    style={[styles.seanceRow, i > 0 && styles.seanceRowBorder]}
                    onPress={() => router.push(`/sportif/programme/${featured.id}`)}
                    activeOpacity={0.8}
                  >
                    <ExerciseThumb exercise={firstEx ? library.get(firstEx.exerciceId) : null} size={48} radius={12} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.seanceName} numberOfLines={1}>
                        {se.nom}
                      </Text>
                      <Text style={styles.seanceFocus} numberOfLines={1}>
                        {focus ? `Focus : ${focus}` : `${se.blocs.reduce((n, b) => n + b.exercices.length, 0)} exercices`}
                      </Text>
                    </View>
                    <View style={[styles.doneCircle, done && styles.doneCircleOn]}>
                      {done && <Ionicons name="checkmark" size={15} color={Colors.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {others.map((p) => (
            <AnimatedPressable
              key={p.id}
              style={styles.programmeRow}
              onPress={() => router.push(`/sportif/programme/${p.id}`)}
            >
              <View style={styles.programmeIconWrap}>
                <Ionicons name="barbell" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programmeName}>{p.nom}</Text>
                <Text style={styles.programmeMeta}>
                  {p.objectif ? `${p.objectif} · ` : ""}
                  {p.seances.length} séance{p.seances.length > 1 ? "s" : ""}
                  {durationOf(p) ? ` · ${durationOf(p)}` : ""}
                </Text>
                <View style={styles.rowTrack}>
                  <View style={[styles.rowFill, { width: `${Math.round(progressOf(p) * 100)}%` }]} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </AnimatedPressable>
          ))}
        </>
      )}
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
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  title: {
    fontFamily: Type.heading,
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 20,
  },

  tabsScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },

  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },

  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },

  tabTextActive: {
    color: Colors.white,
  },

  heroCard: {
    overflow: "hidden",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    minHeight: 150,
  },

  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },

  heroTitle: {
    fontFamily: Type.heading,
    fontSize: 22,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 6,
  },

  heroMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  heroTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 14,
    overflow: "hidden",
  },

  heroFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.primaryLight,
  },

  heroPercent: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
  },

  rowTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.grayLight,
    marginTop: 8,
    overflow: "hidden",
  },

  rowFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.turquoise,
  },

  seancesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  seancesTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  seanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },

  seanceRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },

  seanceName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: Colors.text,
  },

  seanceFocus: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  doneCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Colors.grayMedium,
    alignItems: "center",
    justifyContent: "center",
  },

  doneCircleOn: {
    backgroundColor: Colors.turquoise,
    borderColor: Colors.turquoise,
  },

  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },

  heroButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: Colors.primaryDark,
  },

  emptyCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: "center",
    gap: 6,
  },

  emptyButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  emptyButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  programmeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  programmeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentTint,
    justifyContent: "center",
    alignItems: "center",
  },

  programmeName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  programmeMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
