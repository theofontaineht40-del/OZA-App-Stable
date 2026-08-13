import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GraphGridTexture } from "../../components/decor";
import ProgressionChart, { ProgressionPoint } from "../../components/progression-chart";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import { getSessionsForSportif, SessionRecord } from "../../services/tracking";

export default function HistoriqueScreen() {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [selectedExercice, setSelectedExercice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const data = await getSessionsForSportif(user.uid);
        setSessions(data);
      } catch {
        setSessions([]);
      }
    });

    return unsubscribe;
  }, []);

  const progressionByExercice = useMemo(() => {
    const map: Record<string, ProgressionPoint[]> = {};
    (sessions ?? []).forEach((session) => {
      session.exerciseLogs?.forEach((log) => {
        const value = parseFloat(log.chargeReelle);
        if (isNaN(value)) return;
        if (!map[log.exerciceNom]) map[log.exerciceNom] = [];
        map[log.exerciceNom].push({ date: session.date, value });
      });
    });
    Object.values(map).forEach((points) => points.sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [sessions]);

  const exerciceNames = Object.keys(progressionByExercice).sort();

  if (!sessions) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <GraphGridTexture />
        <Text style={styles.title}>Historique des séances</Text>
        <Text style={styles.subtitle}>Vos séances enregistrées</Text>
      </View>

      {exerciceNames.length > 0 && (
        <View style={styles.progressionSection}>
          <Text style={styles.sectionTitle}>Progression par exercice</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciceChipRow}>
            {exerciceNames.map((nom) => (
              <TouchableOpacity
                key={nom}
                style={[styles.exerciceChip, selectedExercice === nom && styles.exerciceChipActive]}
                onPress={() => setSelectedExercice(selectedExercice === nom ? null : nom)}
              >
                <Text
                  style={[
                    styles.exerciceChipText,
                    selectedExercice === nom && styles.exerciceChipTextActive,
                  ]}
                >
                  {nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedExercice && (
            <ProgressionChart points={progressionByExercice[selectedExercice]} />
          )}
        </View>
      )}

      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>Aucune séance enregistrée pour le moment.</Text>
      ) : (
        sessions.map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sessionDate}>{session.date}</Text>
                {session.loggedBy === "coach" ? (
                  <View style={styles.coachBadge}>
                    <Text style={styles.coachBadgeText}>Ajoutée par le coach</Text>
                  </View>
                ) : null}
              </View>
              {session.programmeNom ? (
                <Text style={styles.sessionProgramme} numberOfLines={1}>
                  {session.programmeNom} · {session.seanceNom}
                </Text>
              ) : null}
              <Text style={styles.sessionDetail}>
                RPE {session.rpe} · {session.duration} min
              </Text>
              {session.commentaire ? (
                <Text style={styles.sessionComment}>{session.commentaire}</Text>
              ) : null}
            </View>
            <Text style={styles.sessionLoad}>{session.load} UA</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  header: {
    position: "relative",
    overflow: "hidden",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  progressionSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },

  exerciceChipRow: {
    marginBottom: 4,
  },

  exerciceChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    marginRight: 8,
  },

  exerciceChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  exerciceChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  exerciceChipTextActive: {
    color: Colors.white,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  sessionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sessionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  coachBadge: {
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  coachBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },

  sessionProgramme: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 2,
  },

  sessionDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sessionComment: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 6,
    fontStyle: "italic",
  },

  sessionLoad: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
});
