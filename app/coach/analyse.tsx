import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GraphGridTexture } from "../../components/decor";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import {
  buildRecommendation,
  buildSportifRow,
  SportifRow,
  SportifStatus,
} from "../../services/coach-analytics";
import {
  getMySportifs,
  getSessionsForCoach,
  getWellnessForCoach,
  SessionRecord,
  SportifSummary,
  WellnessEntry,
} from "../../services/tracking";

const STATUS_LABEL: Record<SportifStatus, string> = {
  ok: "Stable",
  vigilance: "Vigilance",
  attention: "Attention",
};

const STATUS_COLOR: Record<SportifStatus, string> = {
  ok: Colors.riskLow,
  vigilance: Colors.riskMedium,
  attention: Colors.riskHigh,
};

const STATUS_ICON: Record<SportifStatus, keyof typeof Ionicons.glyphMap> = {
  ok: "checkmark-circle",
  vigilance: "alert-circle",
  attention: "warning",
};

const SECTION_ORDER: SportifStatus[] = ["attention", "vigilance", "ok"];

const SECTION_TITLE: Record<SportifStatus, string> = {
  attention: "À adapter aujourd'hui",
  vigilance: "À surveiller",
  ok: "Dans une zone stable",
};

// Détail de "OZA Analyse" (app/coach/index.tsx) : le même calcul de statut
// (buildSportifRow/combineStatus) mais expliqué sportif par sportif, avec les
// vraies valeurs (ACWR, écart de bien-être) derrière chaque badge — pas un
// second moteur de recommandation, juste la mise en mots du premier.
export default function AnalyseScreen() {
  const [sportifs, setSportifs] = useState<SportifSummary[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const [sportifData, sessionData, wellnessData] = await Promise.all([
          getMySportifs(user.uid),
          getSessionsForCoach(user.uid),
          getWellnessForCoach(user.uid),
        ]);
        setSportifs(sportifData);
        setSessions(sessionData);
        setWellness(wellnessData);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const rows: SportifRow[] = useMemo(
    () => sportifs.map((s) => buildSportifRow(s, sessions, wellness)),
    [sportifs, sessions, wellness]
  );

  const sections = useMemo(() => {
    return SECTION_ORDER.map((status) => ({
      status,
      rows: rows.filter((r) => r.status === status),
    })).filter((section) => section.rows.length > 0);
  }, [rows]);

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Accueil</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <GraphGridTexture />
        <Text style={styles.title}>Recommandations</Text>
        <Text style={styles.subtitle}>
          Charge (ACWR) et bien-être de chaque sportif, sportif par sportif
        </Text>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.emptyText}>Aucun sportif rattaché pour le moment.</Text>
      ) : (
        sections.map((section) => (
          <View key={section.status} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: STATUS_COLOR[section.status] }]} />
              <Text style={styles.sectionTitle}>{SECTION_TITLE[section.status]}</Text>
              <Text style={styles.sectionCount}>{section.rows.length}</Text>
            </View>

            {section.rows.map((row) => {
              const recommendation = buildRecommendation(row);
              return (
                <View key={row.uid} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>
                      {row.firstName} {row.lastName}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[row.status]}1A` }]}>
                      <Ionicons name={STATUS_ICON[row.status]} size={12} color={STATUS_COLOR[row.status]} />
                      <Text style={[styles.statusText, { color: STATUS_COLOR[row.status] }]}>
                        {STATUS_LABEL[row.status]}
                      </Text>
                    </View>
                  </View>

                  {recommendation.reasons.map((reason, i) => (
                    <Text key={i} style={styles.reasonText}>
                      · {reason}
                    </Text>
                  ))}

                  {row.status !== "ok" && (
                    <View style={styles.actionRow}>
                      <Ionicons name="bulb-outline" size={14} color={Colors.primary} />
                      <Text style={styles.actionText}>{recommendation.action}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.cardLink}
                    onPress={() => router.push(`/coach/sportif/${row.uid}`)}
                  >
                    <Text style={styles.cardLinkText}>Voir la fiche</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              );
            })}
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

  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },

  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  reasonText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.accentTint,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },

  actionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryDark,
  },

  cardLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 12,
  },

  cardLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
});
