import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import PhotoBackground from "../../../../components/photo-background";
import { Colors } from "../../../../constants/colors";
import { ChargeType, getProgramme, Programme } from "../../../../services/programmes";

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
  const pagerRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    getProgramme(id).then((p) => {
      setProgramme(p);
      setActiveIndex(0);
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
          <Ionicons name="chevron-back" size={24} color={Colors.textOnDark} />
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
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => router.push(`/sportif/programme/${programme.id}/seance/${seance.id}`)}
                    >
                      <Ionicons name="play-circle" size={20} color={Colors.white} />
                      <Text style={styles.startButtonText}>Démarrer cette séance</Text>
                    </TouchableOpacity>

                    {seance.blocs.length === 0 ? (
                      <Text style={styles.emptyText}>Aucun bloc dans cette séance.</Text>
                    ) : (
                      seance.blocs.map((bloc) => (
                        <View key={bloc.id} style={[styles.blocCard, { borderLeftColor: bloc.couleur }]}>
                          <Text style={styles.blocNom}>{bloc.nom}</Text>
                          {!!bloc.objectif && <Text style={styles.blocObjectif}>{bloc.objectif}</Text>}

                          {bloc.exercices.map((ex) => (
                            <View key={ex.id} style={styles.exerciceCard}>
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
                          ))}
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
    color: Colors.textOnDark,
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
    color: Colors.textOnDark,
  },

  seanceTabTextActive: {
    color: Colors.white,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },

  startButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 16,
    marginBottom: 20,
  },

  startButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
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
