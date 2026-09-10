import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import ConfirmModal from "../../../../components/confirm-modal";
import { GraphGridTexture } from "../../../../components/decor";
import { LoadSummary } from "../../../../components/load-summary";
import ProgressionChart, { ProgressionPoint } from "../../../../components/progression-chart";
import WellnessReport from "../../../../components/wellness-report";
import { Colors } from "../../../../constants/colors";
import { auth, db } from "../../../../firebase";
import { buildDailyLoadSeries } from "../../../../services/load";
import { getProgrammesForCoachAndSportif, Programme } from "../../../../services/programmes";
import { deleteManagedSportif, getRelation, Relation } from "../../../../services/relations";
import {
  getSessionsForCoach,
  getWellnessForCoach,
  SessionRecord,
  WellnessEntry,
} from "../../../../services/tracking";
import { resetPassword } from "../../../../services/auth";
import { downloadLoadReportPdf, downloadWellnessReportPdf } from "../../../../services/report-pdf";
import { showAlert } from "../../../../utils/alert";
import { friendlyAuthError } from "../../../../utils/firebase-errors";

export default function SportifDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [managed, setManaged] = useState(false);
  const [relation, setRelation] = useState<Relation | null | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [deleteStep, setDeleteStep] = useState<"none" | "confirm" | "typeName">("none");
  const [deleteNameInput, setDeleteNameInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reportBusy, setReportBusy] = useState<"wellness" | "load" | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const coachId = user.uid;
      setCoachUid(coachId);

      try {
        const userSnap = await getDoc(doc(db, "users", id));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setName(`${data.firstName} ${data.lastName}`);
          setFirstName(data.firstName ?? null);
          setEmail(data.email ?? null);
          setManaged(data.managed ?? false);
        }
      } catch {
        // Ignoré : le nom n'est pas bloquant pour la suite.
      }

      let rel: Relation | null = null;
      try {
        rel = await getRelation(id, coachId);
      } catch {
        rel = null;
      }
      setRelation(rel);

      if (rel?.type === "principal") {
        try {
          // Règles Firestore : seul un filtre par coachId est autorisable
          // pour une liste, on récupère donc tout son périmètre puis on
          // filtre côté client sur ce sportif précis.
          const sessionData = (await getSessionsForCoach(coachId)).filter(
            (s) => s.sportifId === id
          );
          setSessions(sessionData);
        } catch {
          setSessions([]);
        }

        try {
          const wellnessData = (await getWellnessForCoach(coachId)).filter(
            (w) => w.sportifId === id
          );
          setWellness(wellnessData);
        } catch {
          setWellness([]);
        }

        try {
          const programmeData = await getProgrammesForCoachAndSportif(coachId, id);
          setProgrammes(programmeData);
        } catch {
          setProgrammes([]);
        }
      } else {
        setSessions([]);
      }
    });

    return unsubscribe;
  }, [id]);

  const [selectedExercice, setSelectedExercice] = useState<string | null>(null);

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

  async function handleResetPassword() {
    if (!email) return;
    try {
      await resetPassword(email);
      showAlert(
        "Email envoyé",
        `Un lien de réinitialisation vient d'être envoyé à ${email}. ${name ?? "Le sportif"} devra l'ouvrir pour choisir un nouveau mot de passe.`
      );
    } catch (error) {
      showAlert("Erreur", friendlyAuthError(error));
    }
  }

  async function handleWellnessReport() {
    if (!coachUid || !name || reportBusy) return;
    setReportBusy("wellness");
    try {
      await downloadWellnessReportPdf({ sportifName: name, coachId: coachUid, entriesDesc: wellness });
    } catch (error) {
      showAlert("Téléchargement impossible", error instanceof Error ? error.message : String(error));
    } finally {
      setReportBusy(null);
    }
  }

  async function handleLoadReport() {
    if (!coachUid || !name || reportBusy) return;
    setReportBusy("load");
    try {
      await downloadLoadReportPdf({ sportifName: name, coachId: coachUid, sessions: sessions ?? [] });
    } catch (error) {
      showAlert("Téléchargement impossible", error instanceof Error ? error.message : String(error));
    } finally {
      setReportBusy(null);
    }
  }

  // Suppression en deux étapes (voulu explicitement, après une frayeur sur un
  // programme qu'on croyait perdu) : une confirmation classique, puis taper
  // le prénom exact avant que la suppression réelle ne parte — pas un simple
  // "OK" qu'on peut valider par réflexe.
  function handleDeleteProfile() {
    setDeleteNameInput("");
    setDeleteStep("confirm");
  }

  function handleConfirmStep1() {
    setDeleteStep("typeName");
  }

  async function handleFinalDelete() {
    if (!id || !coachUid || !firstName) return;
    if (deleteNameInput.trim().toLowerCase() !== firstName.trim().toLowerCase()) {
      showAlert("Prénom incorrect", `Tapez exactement "${firstName}" pour confirmer.`);
      return;
    }
    setDeleting(true);
    try {
      await deleteManagedSportif(id, coachUid);
      setDeleteStep("none");
      router.replace("/coach/sportifs");
    } catch {
      showAlert("Erreur", "Impossible de supprimer ce profil pour le moment.");
    } finally {
      setDeleting(false);
    }
  }

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
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Mes sportifs</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <GraphGridTexture />
        <Text style={styles.title}>{name ?? ""}</Text>
        <Text style={styles.subtitle}>Charge d'entraînement — 28 derniers jours</Text>
      </View>

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
        onPress={() =>
          programmes.length > 0
            ? router.push(`/coach/programme/${programmes[0].id}`)
            : router.push("/coach/programmes")
        }
      >
        <Ionicons name="barbell-outline" size={20} color={Colors.primary} />
        <Text style={styles.evaluationLinkText}>Programme</Text>
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

      {/* Un profil géré (créé sans compte, voir createManagedSportif) n'a ni
          email ni mot de passe — rien à réinitialiser. */}
      {!managed && email && (
        <TouchableOpacity style={styles.evaluationLink} onPress={handleResetPassword}>
          <Ionicons name="key-outline" size={20} color={Colors.primary} />
          <Text style={styles.evaluationLinkText}>Réinitialiser le mot de passe</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Seul un profil géré peut être supprimé — un vrai compte auto-inscrit
          ne l'est jamais depuis l'app, voir firestore.rules. */}
      {managed && (
        <TouchableOpacity style={styles.deleteLink} onPress={handleDeleteProfile}>
          <Ionicons name="trash-outline" size={20} color={Colors.riskHigh} />
          <Text style={styles.deleteLinkText}>Supprimer ce profil</Text>
        </TouchableOpacity>
      )}

      {(wellness.length > 0 || (sessions?.length ?? 0) > 0) && (
        <View style={styles.reportRow}>
          {wellness.length > 0 && (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={handleWellnessReport}
              disabled={reportBusy !== null}
            >
              <Ionicons
                name={reportBusy === "wellness" ? "hourglass-outline" : "download-outline"}
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.reportButtonText}>
                {reportBusy === "wellness" ? "Génération…" : "Rapport bien-être"}
              </Text>
            </TouchableOpacity>
          )}
          {(sessions?.length ?? 0) > 0 && (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={handleLoadReport}
              disabled={reportBusy !== null}
            >
              <Ionicons
                name={reportBusy === "load" ? "hourglass-outline" : "download-outline"}
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.reportButtonText}>
                {reportBusy === "load" ? "Génération…" : "Rapport charge"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <WellnessReport entriesDesc={wellness} dailyLoads28={dailyLoads28} />

      <LoadSummary dailyLoads28={dailyLoads28} />

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

      <View style={styles.sessionsHeaderRow}>
        <Text style={styles.sectionTitle}>Historique des séances</Text>
        <TouchableOpacity
          style={styles.addSessionButton}
          onPress={() => router.push(`/coach/sportif/${id}/nouvelle-seance`)}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
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
                    <Text style={styles.coachBadgeText}>Ajoutée par vous</Text>
                  </View>
                ) : null}
              </View>
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

    <ConfirmModal
      visible={deleteStep === "confirm"}
      title="Voulez-vous vraiment supprimer ce profil ?"
      message={`Toutes les données de ${name ?? "ce profil"} (séances, bien-être, planification, bilans) ne seront plus accessibles. Cette action est irréversible.`}
      confirmLabel="Continuer"
      destructive
      onCancel={() => setDeleteStep("none")}
      onConfirm={handleConfirmStep1}
    />

    <ConfirmModal
      visible={deleteStep === "typeName"}
      title="Dernière confirmation"
      message={`Pour confirmer la suppression définitive, tapez le prénom "${firstName ?? ""}" ci-dessous.`}
      confirmLabel={deleting ? "Suppression…" : "Supprimer définitivement"}
      destructive
      onCancel={() => setDeleteStep("none")}
      onConfirm={handleFinalDelete}
    >
      <TextInput
        style={styles.deleteInput}
        placeholderTextColor={Colors.textSecondary}
        placeholder={firstName ?? ""}
        value={deleteNameInput}
        onChangeText={setDeleteNameInput}
        autoCapitalize="none"
      />
    </ConfirmModal>
    </>
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
    marginBottom: 20,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.accentTint,
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
    backgroundColor: Colors.surface,
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

  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginBottom: 20,
  },

  deleteLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.riskHigh,
  },

  deleteInput: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 16,
  },

  reportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },

  reportButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  sessionsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  progressionSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  exerciceChipRow: {
    marginTop: 10,
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

  addSessionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
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
