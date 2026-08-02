import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { LoadSummary } from "../../../../components/load-summary";
import { Colors } from "../../../../constants/colors";
import { auth, db } from "../../../../firebase";
import { buildDailyLoadSeries } from "../../../../services/load";
import { getRelation, Relation } from "../../../../services/relations";
import {
  getSessionsForSportif,
  getWellnessForSportif,
  SessionRecord,
} from "../../../../services/tracking";

export default function SportifDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState<string | null>(null);
  const [relation, setRelation] = useState<Relation | null | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [wellness, setWellness] = useState<{ date: string; score: number } | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const coachId = user.uid;

      const userSnap = await getDoc(doc(db, "users", id));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(`${data.firstName} ${data.lastName}`);
      }

      const rel = await getRelation(id, coachId);
      setRelation(rel);

      if (rel?.type === "principal") {
        const sessionData = await getSessionsForSportif(id);
        setSessions(sessionData);

        const wellnessData = await getWellnessForSportif(id);
        setWellness(wellnessData[0] ?? null);
      }
    });

    return unsubscribe;
  }, [id]);

  if (relation === undefined || !name) {
    return <View style={styles.container} />;
  }

  if (relation === null) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredEmpty}>
          <Ionicons name="lock-closed-outline" size={40} color={Colors.grayMedium} />
          <Text style={styles.emptyTitle}>Accès non autorisé</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas de lien de suivi avec ce sportif.
          </Text>
        </View>
      </View>
    );
  }

  if (relation.type === "specialiste") {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
          <Text style={styles.backText}>Mes sportifs</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Intervenant · {relation.specialite}</Text>
        </View>
        <Text style={styles.restrictedNotice}>
          Vous intervenez auprès de ce sportif en tant que spécialiste. Le dossier complet,
          les programmes et la planification restent gérés par son coach principal.
        </Text>

        <TouchableOpacity
          style={styles.evaluationLink}
          onPress={() => router.push(`/coach/messages/${id}`)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
          <Text style={styles.evaluationLinkText}>Messagerie</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!sessions) {
    return <View style={styles.container} />;
  }

  const dailyLoads28 = buildDailyLoadSeries(sessions, 28);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Mes sportifs</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{name ?? ""}</Text>
      <Text style={styles.subtitle}>Charge d'entraînement — 28 derniers jours</Text>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/profil-medical`)}
      >
        <Ionicons name="medkit-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Profil médical</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/hygiene-vie`)}
      >
        <Ionicons name="nutrition-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Hygiène de vie & Nutrition</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/morphologie`)}
      >
        <Ionicons name="body-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Bilan morphologique</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/posture`)}
      >
        <Ionicons name="accessibility-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Analyse posturale</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/mobilite`)}
      >
        <Ionicons name="move-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Tests de mobilité</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/tests-physiques`)}
      >
        <Ionicons name="stopwatch-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Tests physiques</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/task-analysis`)}
      >
        <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Task Analysis</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/sportif/${id}/planification`)}
      >
        <Ionicons name="calendar-number-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Planification</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.evaluationLink}
        onPress={() => router.push(`/coach/messages/${id}`)}
      >
        <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Messagerie</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      {wellness && (
        <View style={styles.wellnessCard}>
          <Ionicons name="happy-outline" size={20} color={Colors.primary} />
          <View>
            <Text style={styles.wellnessScore}>
              Bien-être : {wellness.score.toFixed(1)} / 5
            </Text>
            <Text style={styles.wellnessDate}>Dernier questionnaire : {wellness.date}</Text>
          </View>
        </View>
      )}

      <LoadSummary dailyLoads28={dailyLoads28} />

      <Text style={styles.sectionTitle}>Historique des séances</Text>
      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>Aucune séance enregistrée pour le moment.</Text>
      ) : (
        sessions.map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View>
              <Text style={styles.sessionDate}>{session.date}</Text>
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

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
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
    marginBottom: 20,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1F7",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },

  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  restrictedNotice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 18,
  },

  centeredEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  evaluationLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  evaluationLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  wellnessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF1F7",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  wellnessScore: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  wellnessDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
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
