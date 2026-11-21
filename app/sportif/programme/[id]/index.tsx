import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Type } from "../../../../constants/tokens";
import PhotoBackground from "../../../../components/photo-background";
import { Colors } from "../../../../constants/colors";
import { auth } from "../../../../firebase";
import ExerciseThumb from "../../../../components/exercise-thumb";
import InlineLoopingVideo from "../../../../components/inline-looping-video";
import { ExerciseTemplate } from "../../../../constants/exercise-library";
import { getExerciseLibrary } from "../../../../services/exercises";
import { estimateSeanceMinutes } from "../../../../services/programmes";
import { MUSCLE_ID_LABELS } from "../../../../constants/muscle-selection";
import GradientFill from "../../../../components/gradient-fill";
import { LinearGradient } from "expo-linear-gradient";
import {
  getOneRepMaxesForSportif,
  referenceMap,
  roundKg,
} from "../../../../services/one-rep-max";
import { blocModeLabel, ChargeType, getProgramme, Programme } from "../../../../services/programmes";

const CHARGE_LABELS: Record<ChargeType, string> = {
  "1rm": "% 1RM",
  rpe: "RPE",
  libre: "kg",
};

export default function SportifProgrammeViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  // Photos des exercices : la bibliothèque appartient au coach, pas au
  // programme lui-même — il faut la charger séparément une fois qu'on
  // connaît programme.coachId (voir aussi le constructeur côté coach, qui
  // fait le même lookup par exerciceId).
  const [photosByExerciceId, setPhotosByExerciceId] = useState<Map<string, ExerciseTemplate>>(
    new Map()
  );
  // 1RM de référence du sportif (exerciceId → kg) : convertit les charges
  // en "% 1RM" du programme en kilos. Absent = on garde le simple pourcentage.
  const [oneRms, setOneRms] = useState<Map<string, number>>(new Map());
  const pagerRef = useRef<ScrollView>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) return;
      getOneRepMaxesForSportif(user.uid)
        .then((records) => setOneRms(referenceMap(records)))
        .catch(() => {
          // Pas de 1RM lisible : on affiche juste le pourcentage.
        });
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    getProgramme(id).then((p) => {
      setProgramme(p);
      setActiveIndex(0);
      if (p?.coachId) {
        getExerciseLibrary(p.coachId)
          .then((library) => {
            setPhotosByExerciceId(new Map(library.map((e) => [e.id, e])));
          })
          .catch(() => {
            // Pas de photo plutôt que bloquer l'affichage du programme.
          });
      }
    });
  }, [id]);

  if (!programme) {
    return <View style={styles.container} />;
  }

  const activeSeance = programme.seances[activeIndex] ?? programme.seances[0];

  function goToIndex(i: number) {
    setActiveIndex(i);
    pagerRef.current?.scrollTo({ x: i * pageWidth, animated: true });
  }

  // Le swipe fait foi : si l'utilisateur glisse au lieu de taper un onglet,
  // c'est cette page qui détermine l'onglet actif, pas l'inverse.
  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pageWidth <= 0) return;
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
  }

  return (
    <View style={styles.container}>
      <PhotoBackground variant="programmes" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.programmeNom}>{programme.nom}</Text>
      </View>

      {activeSeance && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seanceTabs}>
            {programme.seances.map((s, i) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.seanceTab, activeIndex === i && styles.seanceTabActive]}
                onPress={() => goToIndex(i)}
              >
                <Text style={[styles.seanceTabText, activeIndex === i && styles.seanceTabTextActive]}>
                  {s.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Le swipe fonctionne sur toute la largeur de l'écran (pas
              seulement sur la petite barre d'onglets) : chaque séance est une
              page d'un pager horizontal, avec son propre scroll vertical à
              l'intérieur pour la liste des blocs. */}
          <View style={styles.pagerWrap} onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
            {pageWidth > 0 && (
              <ScrollView
                ref={pagerRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
                onScroll={onMomentumScrollEnd}
                scrollEventThrottle={32}
                contentOffset={{ x: activeIndex * pageWidth, y: 0 }}
              >
                {programme.seances.map((seance) => (
                  <ScrollView
                    key={seance.id}
                    style={{ width: pageWidth }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.seanceHero}>
                      <Image
                        source={require("../../../../assets/images/gym-teal.jpg")}
                        style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={["rgba(6,45,43,0.35)", "rgba(6,45,43,0.92)"]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
                      />
                      <Text style={styles.seanceHeroEyebrow}>{programme.objectif ?? "Programme"}</Text>
                      <Text style={styles.seanceHeroTitle}>{seance.nom}</Text>
                      <View style={styles.seanceHeroMeta}>
                        <View style={styles.metaChip}>
                          <Ionicons name="barbell-outline" size={13} color={Colors.primaryLight} />
                          <Text style={styles.metaChipText}>
                            {seance.blocs.reduce((n, b) => n + b.exercices.length, 0)} exercices
                          </Text>
                        </View>
                        {estimateSeanceMinutes(seance) > 0 && (
                          <View style={styles.metaChip}>
                            <Ionicons name="time-outline" size={13} color={Colors.primaryLight} />
                            <Text style={styles.metaChipText}>≈ {estimateSeanceMinutes(seance)} min</Text>
                          </View>
                        )}
                        {(seance.muscles ?? []).slice(0, 3).map((m) => (
                          <View key={m} style={styles.metaChip}>
                            <Text style={styles.metaChipText}>{MUSCLE_ID_LABELS[m]}</Text>
                          </View>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => router.push(`/sportif/programme/${programme.id}/seance/${seance.id}`)}
                      >
                        <GradientFill />
                        <Ionicons name="play" size={16} color={Colors.white} />
                        <Text style={styles.startButtonText}>Démarrer la séance</Text>
                      </TouchableOpacity>
                    </View>

                    {seance.blocs.some((b) => b.exercices.length > 0) && (
                      <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>Aperçu des exercices</Text>
                        {seance.blocs.flatMap((b) => b.exercices).map((ex, i) => (
                          <View key={ex.id} style={[styles.previewRow, i > 0 && styles.previewRowBorder]}>
                            <ExerciseThumb exercise={photosByExerciceId.get(ex.exerciceId)} size={46} radius={12} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={styles.previewName} numberOfLines={1}>
                                {ex.exerciceNom}
                              </Text>
                              <Text style={styles.previewMeta}>
                                {ex.series} × {ex.repetitions}
                                {ex.chargeValeur ? ` · ${ex.chargeValeur} ${CHARGE_LABELS[ex.chargeType]}` : ""}
                                {ex.poidsIndicatif ? ` · ~${ex.poidsIndicatif} kg` : ""}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {seance.blocs.length === 0 ? (
                      <Text style={styles.emptyText}>Aucun bloc dans cette séance.</Text>
                    ) : (
                      seance.blocs.map((bloc) => (
                        <View key={bloc.id} style={[styles.blocCard, { borderLeftColor: bloc.couleur }]}>
                          <View style={styles.blocNomRow}>
                            <Text style={styles.blocNom}>{bloc.nom}</Text>
                            {!!blocModeLabel(bloc) && (
                              <View style={styles.modeBadge}>
                                <Text style={styles.modeBadgeText}>{blocModeLabel(bloc)}</Text>
                              </View>
                            )}
                          </View>
                          {!!bloc.objectif && <Text style={styles.blocObjectif}>{bloc.objectif}</Text>}

                          {bloc.exercices.map((ex) => {
                            const template = photosByExerciceId.get(ex.exerciceId);
                            return (
                            <View key={ex.id} style={styles.exerciceCard}>
                              {template?.videoUrl ? (
                                <View style={[styles.exercicePhoto, { overflow: "hidden" }]}>
                                  <InlineLoopingVideo videoUrl={template.videoUrl} width="100%" height={160} borderRadius={0} />
                                </View>
                              ) : template?.photoUrl ? (
                                <Image
                                  source={{ uri: template.photoUrl }}
                                  style={styles.exercicePhoto}
                                  resizeMode="contain"
                                />
                              ) : (
                                <View style={styles.exerciceIllustration}>
                                  <ExerciseThumb exercise={template} size={72} />
                                </View>
                              )}
                              <Text style={styles.exerciceName}>{ex.exerciceNom}</Text>

                              <View style={styles.setsRepsRow}>
                                <Text style={styles.setsRepsValue}>
                                  {ex.series} × {ex.repetitions}
                                </Text>
                              </View>

                              <View style={styles.detailGrid}>
                                <View style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>Tempo</Text>
                                  <Text style={styles.detailValue}>{ex.tempo || "—"}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>Charge</Text>
                                  <Text style={styles.detailValue}>
                                    {ex.chargeValeur ? `${ex.chargeValeur} ${CHARGE_LABELS[ex.chargeType]}` : "—"}
                                    {ex.chargeType === "1rm" && ex.chargeValeur && oneRms.get(ex.exerciceId)
                                      ? ` ≈ ${roundKg((parseFloat(ex.chargeValeur.replace(",", ".")) / 100) * oneRms.get(ex.exerciceId)!)} kg`
                                      : ""}
                                  </Text>
                                </View>
                                <View style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>Poids indicatif</Text>
                                  <Text style={styles.detailValue}>
                                    {ex.poidsIndicatif ? `${ex.poidsIndicatif} kg` : "—"}
                                  </Text>
                                </View>
                                <View style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>Repos séries</Text>
                                  <Text style={styles.detailValue}>{ex.reposSeries || "—"}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                  <Text style={styles.detailLabel}>Repos répétitions</Text>
                                  <Text style={styles.detailValue}>{ex.reposRepetitions || "—"}</Text>
                                </View>
                              </View>

                              {!!ex.commentaires && (
                                <Text style={styles.commentaires}>{ex.commentaires}</Text>
                              )}
                            </View>
                            );
                          })}
                        </View>
                      ))
                    )}
                  </ScrollView>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 12,
  },

  programmeNom: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },

  seanceTabs: {
    paddingHorizontal: 20,
    marginBottom: 8,
    flexGrow: 0,
  },

  pagerWrap: {
    flex: 1,
  },

  seanceTab: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    marginRight: 8,
  },

  seanceTabActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },

  seanceTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  seanceTabTextActive: {
    color: Colors.white,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },

  seanceHero: {
    overflow: "hidden",
    borderRadius: 22,
    minHeight: 220,
    justifyContent: "flex-end",
    padding: 18,
    marginBottom: 16,
  },

  seanceHeroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Colors.primaryLight,
  },

  seanceHeroTitle: {
    fontFamily: Type.heading,
    fontSize: 28,
    color: Colors.white,
    marginTop: 4,
  },

  seanceHeroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },

  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  metaChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },

  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  previewTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },

  previewRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },

  previewName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: Colors.text,
  },

  previewMeta: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  startButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
  },

  startButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  blocCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  blocNomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  modeBadge: {
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  modeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },

  blocNom: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  blocObjectif: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },

  exerciceCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },

  // Déborde jusqu'aux bords de la carte (marges négatives = padding de
  // exerciceCard) pour une vraie photo bien visible, pas une icône minuscule.
  exerciceIllustration: {
    alignItems: "center",
    marginBottom: 8,
  },

  exercicePhoto: {
    height: 160,
    marginTop: -14,
    marginHorizontal: -14,
    marginBottom: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: Colors.surface,
  },

  exerciceName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },

  setsRepsRow: {
    marginBottom: 12,
  },

  setsRepsValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  detailItem: {
    minWidth: "40%",
  },

  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  commentaires: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 12,
    fontStyle: "italic",
  },
});
