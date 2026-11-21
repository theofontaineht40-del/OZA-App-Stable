import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { Radius, Shadow, Type } from "../constants/tokens";
import { db } from "../firebase";
import { Group, createGroup, deleteGroup, subscribeToGroups } from "../services/groups";
import { SportifSummary } from "../services/tracking";
import { messageTimeLabel } from "../utils/message-time";
import { showAlert } from "../utils/alert";
import ConfirmModal from "./confirm-modal";

// Groupes de discussion : liste (coach et sportif) et création / suppression
// (coach). Les sportifs proposés à la création sont ceux que le coach suit.
export default function GroupsSection({
  uid,
  role,
  sportifs = [],
}: {
  uid: string;
  role: "coach" | "sportif";
  sportifs?: SportifSummary[];
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Group | null>(null);

  useEffect(() => subscribeToGroups(uid, role, setGroups), [uid, role]);

  const base = role === "coach" ? "/coach/messages/group" : "/sportif/messages/group";

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function create() {
    if (!name.trim() || selected.length === 0 || saving) return;
    setSaving(true);
    try {
      const coachSnap = await getDoc(doc(db, "users", uid));
      const c = coachSnap.data();
      const coachName = `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim() || "Coach";
      const members = sportifs
        .filter((s) => selected.includes(s.uid))
        .map((s) => ({ uid: s.uid, name: `${s.firstName} ${s.lastName}`.trim() }));
      const id = await createGroup({ uid, name: coachName }, name, members);
      setCreating(false);
      setName("");
      setSelected([]);
      router.push(`${base}/${id}` as never);
    } catch {
      showAlert("Erreur", "Impossible de créer le groupe pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  if (role === "sportif" && groups.length === 0) return null;
  if (role === "coach" && sportifs.length === 0 && groups.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.heading}>Groupes</Text>
        {role === "coach" && sportifs.length > 0 && (
          <TouchableOpacity style={styles.newBtn} onPress={() => setCreating(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color={Colors.primaryDark} />
            <Text style={styles.newText}>Nouveau groupe</Text>
          </TouchableOpacity>
        )}
      </View>

      {groups.length === 0 ? (
        <Text style={styles.empty}>Crée un groupe pour écrire à plusieurs sportifs en même temps.</Text>
      ) : (
        groups.map((g) => {
          const unread = g.unreadFor.includes(uid);
          return (
            <TouchableOpacity key={g.id} style={styles.row} activeOpacity={0.85} onPress={() => router.push(`${base}/${g.id}` as never)}>
              <View style={styles.avatar}>
                <Ionicons name="people" size={20} color={Colors.white} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{g.name}</Text>
                  {unread && (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>Non lu</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <Text style={styles.time}>{messageTimeLabel(g.lastMessageAt)}</Text>
                </View>
                <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                  {g.lastMessageText
                    ? `${g.lastMessageSenderId === uid ? "Toi" : g.lastSenderName.split(" ")[0]} : ${g.lastMessageText}`
                    : `${g.memberIds.length + 1} participants`}
                </Text>
              </View>
              {role === "coach" && (
                <TouchableOpacity onPress={() => setToDelete(g)} hitSlop={10} accessibilityLabel="Supprimer le groupe">
                  <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })
      )}

      <Modal visible={creating} transparent animationType="slide" onRequestClose={() => setCreating(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Nouveau groupe</Text>
              <TouchableOpacity onPress={() => setCreating(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nom du groupe (ex. Équipe senior)"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={60}
            />
            <Text style={styles.label}>Participants ({selected.length})</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {sportifs.map((s) => {
                const on = selected.includes(s.uid);
                return (
                  <TouchableOpacity key={s.uid} style={styles.pick} onPress={() => toggle(s.uid)} activeOpacity={0.8}>
                    <Text style={styles.pickName}>{s.firstName} {s.lastName}</Text>
                    <View style={[styles.box, on && styles.boxOn]}>
                      {on && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cta, (!name.trim() || selected.length === 0 || saving) && { opacity: 0.45 }]}
              onPress={create}
              disabled={!name.trim() || selected.length === 0 || saving}
            >
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.ctaText}>Créer le groupe</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={toDelete !== null}
        title="Supprimer le groupe"
        message={`« ${toDelete?.name ?? ""} » et tous ses messages disparaissent pour tous les participants.`}
        confirmLabel="Supprimer"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          const g = toDelete;
          setToDelete(null);
          if (!g) return;
          try {
            await deleteGroup(g.id);
          } catch {
            showAlert("Erreur", "Impossible de supprimer le groupe.");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 22 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  heading: { fontFamily: Type.heading, fontSize: 20, color: Colors.text },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.accentTint, borderRadius: Radius.pill, paddingVertical: 7, paddingHorizontal: 12 },
  newText: { fontSize: 12.5, fontWeight: "700", color: Colors.primaryDark },
  empty: { fontSize: 13, color: Colors.textSecondary },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, ...Shadow.card },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.canard, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flexShrink: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
  time: { fontSize: 11.5, color: Colors.textSecondary },
  preview: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  previewUnread: { color: Colors.text, fontWeight: "600" },
  unread: { backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  unreadText: { color: Colors.white, fontSize: 10, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(6,45,43,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, width: "100%", maxWidth: 560, alignSelf: "center" },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { fontFamily: Type.heading, fontSize: 22, color: Colors.text },
  input: { height: 50, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.background },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, color: Colors.textSecondary, textTransform: "uppercase", marginTop: 16, marginBottom: 6 },
  pick: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickName: { fontSize: 15, color: Colors.text },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cta: { height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginTop: 16 },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
});
