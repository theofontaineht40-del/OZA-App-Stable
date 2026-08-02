import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  const [activeSeanceId, setActiveSeanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProgramme(id).then((p) => {
      setProgramme(p);
      if (p) setActiveSeanceId(p.seances[0]?.id ?? null);
    });
  }, [id]);

  if (!programme) {
    return <View style={styles.container} />;
  }

  const activeSeance = programme.seances.find((s) => s.id === activeSeanceId) ?? programme.seances[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.programmeNom}>{programme.nom}</Text>
      </View>

      {activeSeance && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seanceTabs}>
            {programme.seances.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.seanceTab, activeSeance.id === s.id && styles.seanceTabActive]}
                onPress={() => setActiveSeanceId(s.id)}
              >
                <Text
                  style={[styles.seanceTabText, activeSeance.id === s.id && styles.seanceTabTextActive]}
                >
                  {s.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push(`/sportif/programme/${programme.id}/seance/${activeSeance.id}`)}
            >
              <Ionicons name="play-circle" size={20} color={Colors.white} />
              <Text style={styles.startButtonText}>Démarrer cette séance</Text>
            </TouchableOpacity>

            {activeSeance.blocs.length === 0 ? (
              <Text style={styles.emptyText}>Aucun bloc dans cette séance.</Text>
            ) : (
              activeSeance.blocs.map((bloc) => (
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
    paddingTop: 60,
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
    backgroundColor: Colors.text,
    borderColor: Colors.text,
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
    color: Colors.textSecondary,
  },

  blocCard: {
    backgroundColor: Colors.white,
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
