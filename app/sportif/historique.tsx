import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import { getSessionsForSportif, SessionRecord } from "../../services/tracking";

export default function HistoriqueScreen() {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);

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

  if (!sessions) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Historique des séances</Text>
      <Text style={styles.subtitle}>Vos séances enregistrées</Text>

      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>Aucune séance enregistrée pour le moment.</Text>
      ) : (
        sessions.map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionDate}>{session.date}</Text>
              {session.programmeNom ? (
                <Text style={styles.sessionProgramme} numberOfLines={1}>
                  {session.programmeNom} · {session.seanceNom}
                </Text>
              ) : null}
              <Text style={styles.sessionDetail}>
                RPE {session.rpe} · {session.duration} min
              </Text>
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

  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
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

  sessionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
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

  sessionLoad: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
});
