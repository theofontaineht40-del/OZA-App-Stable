import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { blockDateRange, newBlockId, savePlanification } from "../../services/planification";
import { createManagedSportif } from "../../services/relations";
import { addWellnessEntry } from "../../services/tracking";

// Écran d'import UNIQUE (à supprimer après usage) : reconstitue dans OZA
// l'historique réel de Julie Anaclet déjà consigné dans son tableur Excel
// (Suivi_Charges_Progression_Athletes_v3_11_complete_2.xlsx, onglet "Julie"),
// pour avoir une vraie traçabilité côté app. Rien n'est inventé : les 97
// lignes ci-dessous sont la transcription exacte des colonnes
// Fatigue/Stress/Sommeil/Courbatures du fichier (03/03 → 18/08/2026).
//
// Conversion d'échelle : le fichier note Fatigue/Stress/Courbatures selon la
// convention Hooper classique (10 = mauvais état), mais Sommeil selon "10 =
// bon état" — confirmé par le coach. L'app OZA stocke les 4 champs selon une
// seule convention ("10 = bon état" partout, voir services/load.ts). Sommeil
// passe donc tel quel ; Fatigue/Stress/Courbatures sont inversés (11 - x).
//
// [date, fatigue brute (10=mauvais), stress brut (10=mauvais), sommeil brut (10=bon), courbatures brutes (10=mauvais)]
const RAW_WELLNESS: [string, number, number, number, number][] = [
  ["2026-03-03", 3, 2, 8.5, 1.5],
  ["2026-03-04", 4.5, 1.5, 6, 3.5],
  ["2026-03-06", 2.5, 1.5, 9, 1],
  ["2026-03-07", 3, 2, 8, 1],
  ["2026-03-10", 2.5, 2.5, 8, 2],
  ["2026-03-11", 3, 2.5, 7.5, 1.5],
  ["2026-03-13", 1.5, 2, 8, 0.5],
  ["2026-03-14", 2, 1.5, 8.5, 1],
  ["2026-03-17", 4, 3, 7, 5.5],
  ["2026-03-18", 4.5, 1.5, 10, 1],
  ["2026-03-20", 4.5, 3, 7.5, 4.5],
  ["2026-03-21", 5, 3, 7, 5],
  ["2026-03-24", 5.5, 3, 7.5, 4.5],
  ["2026-03-25", 4, 4, 6, 1],
  ["2026-03-27", 5, 3.5, 7, 4.5],
  ["2026-03-28", 5, 3, 7.5, 5],
  ["2026-03-31", 4, 3.5, 7, 4.5],
  ["2026-04-01", 2, 2.5, 7.5, 3],
  ["2026-04-03", 4, 3.5, 7.5, 4.5],
  ["2026-04-04", 5, 3, 7, 5],
  ["2026-04-07", 5.5, 2.5, 7.5, 4.5],
  ["2026-04-08", 4, 1, 10, 1.5],
  ["2026-04-10", 5, 3, 7, 4.5],
  ["2026-04-11", 4.5, 3, 7.5, 4.5],
  ["2026-04-14", 3, 2, 8, 3],
  ["2026-04-15", 4.5, 6, 10, 2.5],
  ["2026-04-17", 4, 2.5, 8, 3.5],
  ["2026-04-18", 3, 3, 7.5, 2.5],
  ["2026-04-21", 4, 2, 8, 3.5],
  ["2026-04-22", 2.5, 4.5, 8, 4],
  ["2026-04-24", 4, 2.5, 7.5, 2.5],
  ["2026-04-25", 3, 2.5, 7.5, 3.5],
  ["2026-04-28", 3, 2.5, 8, 3],
  ["2026-04-29", 5, 1, 7, 3.5],
  ["2026-05-01", 3.5, 2, 8.5, 2.5],
  ["2026-05-02", 3.5, 3, 7.5, 3],
  ["2026-05-05", 3, 2.5, 7.5, 3.5],
  ["2026-05-06", 3.5, 3.5, 8, 1.5],
  ["2026-05-08", 4, 2.5, 8, 2.5],
  ["2026-05-09", 4, 3, 8, 2.5],
  ["2026-05-12", 6, 3.5, 6.5, 6],
  ["2026-05-13", 2.5, 3.5, 6.5, 1],
  ["2026-05-15", 6, 3, 6.5, 5.5],
  ["2026-05-16", 6.5, 3, 7, 6.5],
  ["2026-05-19", 6.5, 4, 6, 5.5],
  ["2026-05-20", 3.5, 1.5, 8.5, 4],
  ["2026-05-22", 6, 3, 5.5, 5.5],
  ["2026-05-23", 5.5, 3.5, 6.5, 6.5],
  ["2026-05-26", 6, 4, 7, 6],
  ["2026-05-27", 3, 5.5, 8, 4],
  ["2026-05-29", 5.5, 3, 5.5, 6.5],
  ["2026-05-30", 6.5, 3.5, 7, 5.5],
  ["2026-06-02", 1, 2, 9, 1],
  ["2026-06-03", 2, 4.5, 10, 1],
  ["2026-06-05", 3, 2, 9, 5],
  ["2026-06-06", 2.5, 2, 8.5, 4.5],
  ["2026-06-09", 2, 3, 10, 1],
  ["2026-06-10", 3.5, 1.5, 10, 2],
  ["2026-06-12", 1, 2, 9, 1],
  ["2026-06-13", 0.5, 2, 8.5, 1],
  ["2026-06-16", 4, 2, 9, 3],
  ["2026-06-17", 5, 6, 8.5, 3],
  ["2026-06-19", 1, 2, 7, 1],
  ["2026-06-20", 1, 2.5, 7, 1],
  ["2026-06-23", 2, 1, 8, 4],
  ["2026-06-24", 2.5, 1.5, 6, 3.5],
  ["2026-06-26", 4, 1, 6, 1],
  ["2026-06-27", 4.5, 1, 6.5, 1],
  ["2026-06-30", 2, 1, 10, 4],
  ["2026-07-01", 2.5, 3, 6.5, 4],
  ["2026-07-03", 2, 2.5, 10, 1],
  ["2026-07-04", 2, 2.5, 9.5, 1],
  ["2026-07-07", 2, 2, 8, 2],
  ["2026-07-08", 2.5, 1.5, 9, 2],
  ["2026-07-10", 1, 2.5, 9, 1],
  ["2026-07-11", 1, 2, 9.5, 1],
  ["2026-07-14", 1, 2, 10, 1],
  ["2026-07-15", 3.5, 6, 8.5, 1.5],
  ["2026-07-17", 1, 1, 7, 2],
  ["2026-07-18", 1.5, 1.5, 6.5, 1.5],
  ["2026-07-21", 2, 2, 9, 2],
  ["2026-07-22", 3, 3.5, 7.5, 3.5],
  ["2026-07-24", 3, 2, 10, 1],
  ["2026-07-25", 2.5, 2, 10, 1],
  ["2026-07-28", 3, 2, 9, 4],
  ["2026-07-29", 3, 6, 6.5, 3],
  ["2026-07-31", 5, 1, 7, 1],
  ["2026-08-01", 5, 0.5, 7.5, 0.5],
  ["2026-08-04", 2, 1, 10, 1],
  ["2026-08-05", 4.5, 2, 10, 3.5],
  ["2026-08-07", 2, 1, 10, 2],
  ["2026-08-08", 1.5, 1, 10, 1.5],
  ["2026-08-11", 2, 1, 9, 2],
  ["2026-08-12", 2.5, 2, 9.5, 2.5],
  ["2026-08-14", 3, 2, 9, 1],
  ["2026-08-15", 3, 2, 9, 1],
  ["2026-08-18", 2, 1, 8, 3],
];

// Ancré pour que la "semaine 14" (numérotation déjà utilisée par le coach
// dans ses notes de séance, ex. "[S14]") tombe le 03/03/2026, date confirmée
// pour le début du Bloc 1.
const PLAN_START_DATE = "2025-12-02";

const PLAN_BLOCKS = [
  { label: "Adaptation / Renfo", startWeek: 14, endWeek: 15 },
  { label: "Perte de poids (volume + HIIT)", startWeek: 16, endWeek: 21 },
  { label: "Masse", startWeek: 22, endWeek: 27 },
  // Court jusqu'à la semaine de la déchirure ischio-jambier notée le
  // 18/08/2026 (dernière ligne du journal) — à ajuster dans l'écran
  // Planification si la reprise appelle un découpage différent.
  { label: "Force circuit", startWeek: 28, endWeek: 38 },
];

type Step = "idle" | "running" | "done" | "error";

export default function ImportJulieScreen() {
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<{ firstName: string; lastName: string } | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createdSportifId, setCreatedSportifId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setCoachUid(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setCoachName({ firstName: snap.data().firstName ?? "", lastName: snap.data().lastName ?? "" });
      }
    });
    return unsubscribe;
  }, []);

  async function handleImport() {
    if (!coachUid || !coachName) return;
    setStep("running");
    setError(null);
    setProgress(0);
    try {
      const sportifId = await createManagedSportif(
        coachUid,
        coachName.firstName,
        coachName.lastName,
        "Julie",
        "Anaclet"
      );
      setCreatedSportifId(sportifId);

      await savePlanification(sportifId, {
        objectif: "",
        niveau: "",
        startDate: PLAN_START_DATE,
        competitionDate: null,
        weeksTotal: 38,
        seancesParSemaine: 3,
        blocks: PLAN_BLOCKS.map((b) => ({ ...b, id: newBlockId(), programmeId: null })),
      });

      for (let i = 0; i < RAW_WELLNESS.length; i++) {
        const [date, fatigueRaw, stressRaw, sommeilRaw, courbaturesRaw] = RAW_WELLNESS[i];
        await addWellnessEntry(
          sportifId,
          {
            sommeil: sommeilRaw,
            fatigue: 11 - fatigueRaw,
            stress: 11 - stressRaw,
            courbatures: 11 - courbaturesRaw,
          },
          coachUid,
          undefined,
          date
        );
        setProgress(i + 1);
      }

      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Import Julie Anaclet</Text>
      <Text style={styles.subtitle}>
        Écran à usage unique — à supprimer du code une fois l'import vérifié.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ce qui va être créé</Text>
        <Text style={styles.line}>• Profil géré "Julie Anaclet" (sans compte)</Text>
        <Text style={styles.line}>• Planification — 4 blocs, début {PLAN_START_DATE.split("-").reverse().join("/")}</Text>
        {PLAN_BLOCKS.map((b) => (
          <Text key={b.label} style={styles.blockLine}>
            &nbsp;&nbsp;— {b.label} (S{b.startWeek}–S{b.endWeek}, {blockDateRange(PLAN_START_DATE, b.startWeek, b.endWeek)})
          </Text>
        ))}
        <Text style={styles.line}>
          • {RAW_WELLNESS.length} check-ins de bien-être, du {RAW_WELLNESS[0][0].split("-").reverse().join("/")} au{" "}
          {RAW_WELLNESS[RAW_WELLNESS.length - 1][0].split("-").reverse().join("/")}
        </Text>
      </View>

      {step === "idle" && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleImport}>
          <Text style={styles.primaryButtonText}>Importer</Text>
        </TouchableOpacity>
      )}

      {step === "running" && (
        <View style={styles.progressBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.progressText}>
            Import en cours… {progress}/{RAW_WELLNESS.length} check-ins
          </Text>
        </View>
      )}

      {step === "done" && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.riskLow} />
          <Text style={styles.successText}>Import terminé.</Text>
          {createdSportifId && (
            <TouchableOpacity onPress={() => router.push(`/coach/sportif/${createdSportifId}`)}>
              <Text style={styles.successLink}>Voir la fiche de Julie</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === "error" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Échec : {error}</Text>
        </View>
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
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },

  line: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
  },

  blockLine: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  progressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },

  progressText: {
    fontSize: 13,
    color: Colors.text,
  },

  successBox: {
    alignItems: "center",
    gap: 8,
    padding: 16,
  },

  successText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  successLink: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  errorBox: {
    padding: 16,
  },

  errorText: {
    fontSize: 13,
    color: Colors.riskHigh,
  },
});
