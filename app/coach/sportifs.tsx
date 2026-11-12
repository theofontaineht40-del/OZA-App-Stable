import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { TeamIllustration } from "../../components/empty-illustrations";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import {
  buildSportifRow,
  computeCoachKpis,
  SportifRow,
  SportifStatus,
} from "../../services/coach-analytics";
import {
  acwrLabel,
  agoLabel,
  computeSignals,
  Signal,
  SignalTone,
} from "../../services/coach-signals";
import { todayKey } from "../../services/load";
import { createManagedSportif } from "../../services/relations";
import { getScheduledForCoach, ScheduledSession } from "../../services/schedule";
import {
  getMySportifs,
  getSessionsForCoach,
  getWellnessForCoach,
  SessionRecord,
  SportifSummary,
  WellnessEntry,
} from "../../services/tracking";
import { showAlert } from "../../utils/alert";

const STATUS_RANK: Record<SportifStatus, number> = { attention: 0, vigilance: 1, ok: 2 };

const TONE_COLOR: Record<SignalTone, string> = {
  ok: Colors.riskLow,
  warn: Colors.riskMedium,
  alert: Colors.riskHigh,
};

// En dessous, la liste passe en cartes (le tableau ne tient pas).
const TABLE_MIN_WIDTH = 760;

// "Mes sportifs" : vue d'ensemble de l'équipe — 4 tuiles de situation (prêts /
// à surveiller / signal fort / séances de la semaine, les trois premières
// filtrent la liste), puis un tableau forme · charge · séances · signaux.
// Chaque sportif ouvre sa fiche complète.
//
// Deux façons d'arriver dans cette liste : le sportif s'inscrit lui-même et
// entre le code coach (flux historique), ou le coach crée directement un
// profil "géré" ici — pour un client qui n'utilisera jamais l'app lui-même
// (voir createManagedSportif). Les deux se mélangent ; seul un badge
// distingue les profils gérés.
export default function SportifsTabScreen() {
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<{ firstName: string; lastName: string } | null>(null);
  const [sportifs, setSportifs] = useState<SportifSummary[] | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledSession[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SportifStatus | null>(null);
  const [width, setWidth] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setCoachUid(user.uid);
      try {
        const [data, coachSnap] = await Promise.all([
          getMySportifs(user.uid),
          getDoc(doc(db, "users", user.uid)),
        ]);
        setSportifs(data);
        if (coachSnap.exists()) {
          setCoachName({ firstName: coachSnap.data().firstName ?? "", lastName: coachSnap.data().lastName ?? "" });
        }
      } catch {
        setSportifs([]);
      }

      // Données de suivi : un échec (réseau, règles) laisse la liste affichée,
      // simplement sans signaux.
      try {
        const [sessionData, wellnessData] = await Promise.all([
          getSessionsForCoach(user.uid),
          getWellnessForCoach(user.uid),
        ]);
        setSessions(sessionData);
        setWellness(wellnessData);
      } catch {
        // ignoré, voir ci-dessus
      }
      try {
        setScheduled(await getScheduledForCoach(user.uid));
      } catch {
        // ignoré : le planning est un plus
      }
    });

    return unsubscribe;
  }, []);

  const today = todayKey();

  const rows = useMemo(() => {
    if (!sportifs) return [];
    return sportifs.map((s) => ({
      sportif: s,
      row: buildSportifRow(s, sessions, wellness, scheduled),
    }));
  }, [sportifs, sessions, wellness, scheduled]);

  const counts = useMemo(
    () => ({
      ok: rows.filter((r) => r.row.status === "ok").length,
      vigilance: rows.filter((r) => r.row.status === "vigilance").length,
      attention: rows.filter((r) => r.row.status === "attention").length,
    }),
    [rows]
  );

  const sessionsThisWeek = useMemo(
    () => computeCoachKpis(sportifs?.length ?? 0, sessions, wellness).sessionsThisWeek,
    [sportifs, sessions, wellness]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(({ sportif, row }) => {
        if (statusFilter && row.status !== statusFilter) return false;
        return !q || `${sportif.firstName} ${sportif.lastName}`.toLowerCase().includes(q);
      })
      .sort(
        (a, b) =>
          STATUS_RANK[a.row.status] - STATUS_RANK[b.row.status] ||
          `${a.sportif.firstName} ${a.sportif.lastName}`.localeCompare(
            `${b.sportif.firstName} ${b.sportif.lastName}`
          )
      );
  }, [rows, search, statusFilter]);

  function openCreate() {
    setNewFirstName("");
    setNewLastName("");
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!coachUid || !coachName) return;
    if (!newFirstName.trim() || !newLastName.trim()) {
      showAlert("Nom manquant", "Renseignez le prénom et le nom du sportif.");
      return;
    }
    setCreating(true);
    try {
      const id = await createManagedSportif(
        coachUid,
        coachName.firstName,
        coachName.lastName,
        newFirstName.trim(),
        newLastName.trim()
      );
      setSportifs((prev) => [
        ...(prev ?? []),
        { uid: id, firstName: newFirstName.trim(), lastName: newLastName.trim(), managed: true },
      ]);
      setShowCreate(false);
      router.push(`/coach/sportif/${id}`);
    } catch {
      showAlert("Erreur", "Impossible de créer ce profil pour le moment.");
    } finally {
      setCreating(false);
    }
  }

  if (!sportifs) {
    return <View style={styles.container} />;
  }

  const isTable = width >= TABLE_MIN_WIDTH;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mes sportifs</Text>
            <Text style={styles.subtitle}>
              {sportifs.length} sportif{sportifs.length > 1 ? "s" : ""} suivi{sportifs.length > 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={openCreate}>
            <Ionicons name="add" size={18} color={Colors.white} />
            <Text style={styles.createButtonText}>Créer un sportif</Text>
          </TouchableOpacity>
        </View>

        {sportifs.length === 0 ? (
          <View style={styles.emptyCard}>
            <TeamIllustration size={72} />
            <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
            <Text style={styles.emptyText}>
              Partagez votre code coach pour qu'un sportif s'inscrive lui-même, ou créez
              directement un profil pour un client qui n'utilisera pas l'app.
            </Text>
            <TouchableOpacity style={styles.emptyLink} onPress={() => router.push("/coach/profil")}>
              <Text style={styles.emptyLinkText}>Voir mon code coach</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.tiles}>
              <Tile
                label="Prêts"
                value={counts.ok}
                color={Colors.riskLow}
                active={statusFilter === "ok"}
                onPress={() => setStatusFilter((f) => (f === "ok" ? null : "ok"))}
              />
              <Tile
                label="À surveiller"
                value={counts.vigilance}
                color={Colors.riskMedium}
                active={statusFilter === "vigilance"}
                onPress={() => setStatusFilter((f) => (f === "vigilance" ? null : "vigilance"))}
              />
              <Tile
                label="Signal fort"
                value={counts.attention}
                color={Colors.riskHigh}
                active={statusFilter === "attention"}
                onPress={() => setStatusFilter((f) => (f === "attention" ? null : "attention"))}
              />
              <Tile label="Séances faites 7 j" value={sessionsThisWeek} color={Colors.text} />
            </View>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un sportif"
                placeholderTextColor={Colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {visible.length === 0 ? (
              <Text style={styles.emptyText}>Aucun sportif ne correspond.</Text>
            ) : isTable ? (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.colName]}>SPORTIF</Text>
                  <Text style={[styles.th, styles.colForme]}>FORME</Text>
                  <Text style={[styles.th, styles.colCharge]}>CHARGE</Text>
                  <Text style={[styles.th, styles.colSeances]}>SÉANCES</Text>
                  <Text style={[styles.th, styles.colSignal]}>SIGNAL</Text>
                </View>
                {visible.map(({ sportif, row }) => (
                  <TouchableOpacity
                    key={sportif.uid}
                    style={styles.tableRow}
                    onPress={() => router.push(`/coach/sportif/${sportif.uid}`)}
                  >
                    <View style={[styles.colName, styles.nameCell]}>
                      <Avatar name={sportif.firstName} />
                      <Text style={styles.rowName} numberOfLines={1}>
                        {sportif.firstName} {sportif.lastName}
                      </Text>
                      {sportif.managed && <ManagedBadge />}
                    </View>
                    <View style={styles.colForme}>
                      <FormeCell row={row} today={today} />
                    </View>
                    <View style={styles.colCharge}>
                      <ChargeCell row={row} />
                    </View>
                    <View style={styles.colSeances}>
                      <SeancesCell row={row} />
                    </View>
                    <View style={[styles.colSignal, styles.chips]}>
                      {computeSignals(row, today).map((sig) => (
                        <Chip key={sig.label} signal={sig} />
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              visible.map(({ sportif, row }) => (
                <TouchableOpacity
                  key={sportif.uid}
                  style={styles.card}
                  onPress={() => router.push(`/coach/sportif/${sportif.uid}`)}
                >
                  <View style={styles.nameCell}>
                    <Avatar name={sportif.firstName} />
                    <Text style={styles.rowName} numberOfLines={1}>
                      {sportif.firstName} {sportif.lastName}
                    </Text>
                    {sportif.managed && <ManagedBadge />}
                    <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.cardStats}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardStatLabel}>Forme</Text>
                      <FormeCell row={row} today={today} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardStatLabel}>Charge</Text>
                      <ChargeCell row={row} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardStatLabel}>Séances</Text>
                      <SeancesCell row={row} />
                    </View>
                  </View>
                  <View style={styles.chips}>
                    {computeSignals(row, today).map((sig) => (
                      <Chip key={sig.label} signal={sig} />
                    ))}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Créer un sportif</Text>
            <Text style={styles.modalSubtitle}>
              Pour un client qui n'utilisera pas l'app lui-même — vous saisirez ses séances,
              son suivi et ses bilans à sa place.
            </Text>

            <Text style={styles.fieldLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={Colors.textSecondary}
              value={newFirstName}
              onChangeText={setNewFirstName}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={Colors.textSecondary}
              value={newLastName}
              onChangeText={setNewLastName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreate} disabled={creating}>
                {creating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Tile({
  label,
  value,
  color,
  active,
  onPress,
}: {
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tile, active && { borderColor: color }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.tileLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function ManagedBadge() {
  return (
    <View style={styles.managedBadge}>
      <Text style={styles.managedBadgeText}>Profil géré</Text>
    </View>
  );
}

function Chip({ signal }: { signal: Signal }) {
  const color = TONE_COLOR[signal.tone];
  return (
    <View style={[styles.chip, { backgroundColor: `${color}1F`, borderColor: `${color}55` }]}>
      <Text style={[styles.chipText, { color }]}>{signal.label}</Text>
    </View>
  );
}

function FormeCell({ row, today }: { row: SportifRow; today: string }) {
  if (row.wellnessScore === null) return <Text style={styles.cellMuted}>—</Text>;
  return (
    <View>
      <Text style={styles.cellMain}>
        {row.wellnessScore.toFixed(1)}
        <Text style={styles.cellUnit}> / 10</Text>
      </Text>
      <Text style={styles.cellSub}>{agoLabel(row.lastWellnessDate, today)}</Text>
    </View>
  );
}

function ChargeCell({ row }: { row: SportifRow }) {
  if (!row.hasEnoughHistory) return <Text style={styles.cellMuted}>—</Text>;
  const color =
    row.acwrLevel === "danger" || row.acwrLevel === "risque"
      ? Colors.riskHigh
      : row.acwrLevel === "sous-charge"
      ? Colors.riskUnder
      : Colors.riskLow;
  return (
    <View>
      <Text style={styles.cellMain}>{row.acwr.toFixed(2)}</Text>
      <Text style={[styles.cellSub, { color }]}>{acwrLabel(row)}</Text>
    </View>
  );
}

function SeancesCell({ row }: { row: SportifRow }) {
  if (row.weekPlanned === 0 && row.lateCount === 0) {
    return <Text style={styles.cellMuted}>—</Text>;
  }
  return (
    <View>
      {row.weekPlanned > 0 ? (
        <Text style={styles.cellMain}>
          {row.weekDone}/{row.weekPlanned}
          <Text style={styles.cellUnit}> cette sem.</Text>
        </Text>
      ) : (
        <Text style={styles.cellMuted}>Rien cette sem.</Text>
      )}
      {row.lateCount > 0 && (
        <Text style={[styles.cellSub, { color: Colors.riskHigh }]}>{row.lateCount} en retard</Text>
      )}
    </View>
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

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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

  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  createButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },

  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },

  tile: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },

  tileLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },

  tileValue: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 6,
  },

  table: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: "hidden",
  },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: Colors.grayLight,
  },

  th: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },

  colName: { flex: 2.2, paddingRight: 8 },
  colForme: { flex: 1.1, paddingRight: 8 },
  colCharge: { flex: 1.1, paddingRight: 8 },
  colSeances: { flex: 1.3, paddingRight: 8 },
  colSignal: { flex: 3 },

  nameCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  cellMain: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  cellUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textSecondary,
  },

  cellSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  cellMuted: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },

  cardStats: {
    flexDirection: "row",
    gap: 12,
  },

  cardStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentTint,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },

  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  managedBadge: {
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  managedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },

  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },

  emptyLink: {
    marginTop: 4,
    paddingVertical: 8,
  },

  emptyLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },

  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },

  input: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 14,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.grayLight,
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  modalConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },

  modalConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
});
