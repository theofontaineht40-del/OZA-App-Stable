import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import ConfirmModal from "../../../../components/confirm-modal";
import { Colors } from "../../../../constants/colors";
import { auth, db } from "../../../../firebase";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";
import { todayKey } from "../../../../services/load";
import { getProgrammesForCoachAndSportif, Programme } from "../../../../services/programmes";
import {
  addDays,
  addScheduledSession,
  computeScheduleStatuses,
  copyWeekToNext,
  deleteScheduledSession,
  getScheduledForCoach,
  isoWeekNumber,
  mondayOf,
  ScheduledSession,
  ScheduleStatus,
  summarize,
  weekDates,
} from "../../../../services/schedule";
import { getSessionsForCoach, SessionRecord } from "../../../../services/tracking";
import { showAlert } from "../../../../utils/alert";

const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  done: "Faite",
  late: "En retard",
  today: "Aujourd'hui",
  upcoming: "À venir",
};

const STATUS_COLOR: Record<ScheduleStatus, string> = {
  done: Colors.riskLow,
  late: Colors.riskHigh,
  today: Colors.primary,
  upcoming: Colors.textSecondary,
};

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function PlanningScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPrincipal = usePrincipalAccess(id);
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [items, setItems] = useState<ScheduledSession[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [monday, setMonday] = useState(mondayOf(todayKey()));
  const [addDate, setAddDate] = useState<string | null>(null);
  const [expandedProgrammeId, setExpandedProgrammeId] = useState<string | null>(null);
  const [libreTitle, setLibreTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyConfirm, setCopyConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setCoachUid(user?.uid ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!coachUid || !id) return;
    try {
      const [all, allSessions, progs, userSnap] = await Promise.all([
        getScheduledForCoach(coachUid),
        getSessionsForCoach(coachUid),
        getProgrammesForCoachAndSportif(coachUid, id),
        getDoc(doc(db, "users", id)),
      ]);
      setItems(all.filter((i) => i.sportifId === id));
      setSessions(allSessions.filter((s) => s.sportifId === id));
      setProgrammes(progs);
      if (userSnap.exists()) {
        const d = userSnap.data();
        setName(`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim());
      }
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [coachUid, id]);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayKey();
  const statuses = useMemo(
    () => computeScheduleStatuses(items, sessions, today),
    [items, sessions, today]
  );
  const days = weekDates(monday);
  const weekItems = items.filter((i) => days.includes(i.date));
  const summary = summarize(weekItems, statuses);

  if (!id || isPrincipal === null) return <View style={{ flex: 1 }} />;
  if (!isPrincipal) {
    return <AccessDenied message="Le planning n'est modifiable que par le coach principal." />;
  }

  async function add(data: {
    kind: "programme" | "libre";
    titre: string;
    programmeId?: string;
    programmeNom?: string;
    seanceId?: string;
    seanceNom?: string;
  }) {
    if (!coachUid || !addDate || !id) return;
    setBusy(true);
    try {
      await addScheduledSession({
        coachId: coachUid,
        sportifId: id,
        date: addDate,
        kind: data.kind,
        titre: data.titre,
        programmeId: data.programmeId ?? null,
        programmeNom: data.programmeNom ?? null,
        seanceId: data.seanceId ?? null,
        seanceNom: data.seanceNom ?? null,
      });
      setAddDate(null);
      setLibreTitle("");
      await load();
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteScheduledSession(deleteTarget);
      setDeleteTarget(null);
      await load();
    } catch (error) {
      setDeleteTarget(null);
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  async function confirmCopy() {
    setCopyConfirm(false);
    setBusy(true);
    try {
      const n = await copyWeekToNext(weekItems, monday);
      await load();
      setMonday(addDays(monday, 7));
      showAlert("Semaine copiée", `${n} séance${n > 1 ? "s" : ""} copiée${n > 1 ? "s" : ""} sur la semaine suivante.`);
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  const weekLabel = `S${isoWeekNumber(monday)} · ${shortDate(monday)} – ${shortDate(addDays(monday, 6))}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Planning{name ? ` — ${name}` : ""}</Text>

        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => setMonday(addDays(monday, -7))} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
            <Text style={styles.weekSummary}>
              {summary.done} faite{summary.done > 1 ? "s" : ""} · {summary.toDo} à faire
              {summary.late > 0 ? ` · ${summary.late} en retard` : ""}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setMonday(addDays(monday, 7))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionChip} onPress={() => setMonday(mondayOf(today))}>
            <Text style={styles.actionChipText}>Cette semaine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, weekItems.length === 0 && styles.actionChipDisabled]}
            onPress={() => setCopyConfirm(true)}
            disabled={weekItems.length === 0 || busy}
          >
            <Ionicons name="copy-outline" size={14} color={Colors.primary} />
            <Text style={styles.actionChipText}>Copier vers la semaine suivante</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          days.map((date, i) => {
            const dayItems = items.filter((it) => it.date === date);
            const isToday = date === today;
            return (
              <View key={date} style={[styles.dayCard, isToday && styles.dayCardToday]}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {DAY_NAMES[i]} <Text style={styles.dayDate}>{shortDate(date)}</Text>
                  </Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => setAddDate(date)}>
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
                {dayItems.map((it) => {
                  const st = statuses.get(it.id) ?? "upcoming";
                  return (
                    <View key={it.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{it.titre}</Text>
                        {it.programmeNom ? (
                          <Text style={styles.itemMeta}>{it.programmeNom}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.status, { color: STATUS_COLOR[st] }]}>
                        {STATUS_LABEL[st]}
                      </Text>
                      <TouchableOpacity onPress={() => setDeleteTarget(it.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={addDate !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setAddDate(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Séance du {addDate ? `${DAY_NAMES[days.indexOf(addDate)] ?? ""} ${shortDate(addDate)}` : ""}
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {programmes.length === 0 ? (
                <Text style={styles.itemMeta}>
                  Aucun programme assigné à ce sportif — crée-en un depuis l'onglet Programmes, ou
                  ajoute une séance libre ci-dessous.
                </Text>
              ) : (
                programmes.map((p) => {
                  const open = expandedProgrammeId === p.id;
                  return (
                    <View key={p.id}>
                      <TouchableOpacity
                        style={styles.progRow}
                        onPress={() => setExpandedProgrammeId(open ? null : p.id)}
                      >
                        <Ionicons name="barbell" size={18} color={Colors.primary} />
                        <Text style={styles.progName}>{p.nom}</Text>
                        <Ionicons
                          name={open ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                      {open &&
                        p.seances.map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={styles.seanceRow}
                            disabled={busy}
                            onPress={() =>
                              add({
                                kind: "programme",
                                titre: s.nom,
                                programmeId: p.id,
                                programmeNom: p.nom,
                                seanceId: s.id,
                                seanceNom: s.nom,
                              })
                            }
                          >
                            <Text style={styles.seanceName}>{s.nom}</Text>
                            <Text style={styles.addLink}>Ajouter</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  );
                })
              )}
            </ScrollView>

            <Text style={styles.libreLabel}>Séance libre (sans programme)</Text>
            <View style={styles.libreRow}>
              <TextInput
                style={styles.libreInput}
                value={libreTitle}
                onChangeText={setLibreTitle}
                placeholder="Ex. Match, footing, récupération"
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.libreButton, !libreTitle.trim() && styles.libreButtonDisabled]}
                disabled={!libreTitle.trim() || busy}
                onPress={() => add({ kind: "libre", titre: libreTitle.trim() })}
              >
                <Text style={styles.libreButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setAddDate(null)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={copyConfirm}
        title="Copier la semaine"
        message={`Copier les ${weekItems.length} séance${weekItems.length > 1 ? "s" : ""} de ${weekLabel} sur la semaine suivante, aux mêmes jours ?`}
        confirmLabel="Copier"
        onConfirm={confirmCopy}
        onCancel={() => setCopyConfirm(false)}
      />
      <ConfirmModal
        visible={deleteTarget !== null}
        title="Retirer cette séance du planning"
        message="La séance prévue est supprimée ; une séance déjà réalisée n'est pas touchée."
        confirmLabel="Retirer"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  weekLabel: { fontSize: 15, fontWeight: "700", color: Colors.text },
  weekSummary: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionChipDisabled: { opacity: 0.4 },
  actionChipText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayCardToday: { borderColor: Colors.primary },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayName: { fontSize: 14, fontWeight: "700", color: Colors.text },
  dayNameToday: { color: Colors.primary },
  dayDate: { fontWeight: "400", color: Colors.textSecondary },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  addButtonText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  itemTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  status: { fontSize: 12, fontWeight: "700" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  progRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  progName: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.text },
  seanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 28,
  },
  seanceName: { fontSize: 14, color: Colors.text },
  addLink: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  libreLabel: { fontSize: 13, fontWeight: "600", color: Colors.text, marginTop: 16, marginBottom: 8 },
  libreRow: { flexDirection: "row", gap: 8 },
  libreInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  libreButton: {
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
  },
  libreButtonDisabled: { backgroundColor: Colors.grayMedium },
  libreButtonText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  closeButton: {
    height: 44,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: { fontSize: 14, fontWeight: "700", color: Colors.text },
});
