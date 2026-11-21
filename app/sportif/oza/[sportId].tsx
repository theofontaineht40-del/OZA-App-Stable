import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useOzaBase } from "../../../components/oza/use-oza-base";
import PositionPicker from "../../../components/oza/position-picker";
import SportHero from "../../../components/oza/sport-hero";
import { Colors } from "../../../constants/colors";
import { OZA_NIVEAUX, OzaNiveau, OzaSport } from "../../../constants/oza-sports";
import { Type } from "../../../constants/tokens";
import { auth } from "../../../firebase";
import {
  getOzaProgramsForSport,
  getOzaSport,
  getOzaUserState,
  OzaProgram,
  OzaUserState,
  programProgress,
} from "../../../services/oza-programs";

// Univers d'un sport : en-tête propre à la discipline, sélection du poste,
// niveau, puis les programmes publiés pour ce poste.
export default function OzaSportScreen() {
  const { sportId } = useLocalSearchParams<{ sportId: string }>();
  const base = useOzaBase();
  const [sport, setSport] = useState<OzaSport | null>(null);
  const [programs, setPrograms] = useState<OzaProgram[] | null>(null);
  const [userState, setUserState] = useState<OzaUserState | null>(null);
  const [positionId, setPositionId] = useState<string | null>(null);
  const [niveau, setNiveau] = useState<OzaNiveau | null>(null);

  useEffect(() => {
    if (!sportId) return;
    getOzaSport(sportId).then(setSport);
    getOzaProgramsForSport(sportId).then(setPrograms).catch(() => setPrograms([]));
    const uid = auth.currentUser?.uid;
    if (uid) getOzaUserState(uid).then(setUserState);
  }, [sportId]);

  const visible = useMemo(() => {
    return (programs ?? []).filter(
      (p) =>
        (!positionId || p.positionId === positionId || p.positionId === null) && (!niveau || p.niveau === niveau)
    );
  }, [programs, positionId, niveau]);

  if (!sport) return <View style={styles.container}>{<ActivityIndicator style={{ marginTop: 120 }} color={Colors.primary} />}</View>;

  const position = sport.positions.find((p) => p.id === positionId) ?? null;
  const axes = position?.axes?.length ? position.axes : sport.axes;
  const label = sport.positionLabel === "poste" ? "ton poste" : sport.positionLabel === "axe" ? "ton axe" : "ta spécialité";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <SportHero sport={sport} onBack={() => router.back()} />

        <View style={styles.body}>
          <Text style={styles.section}>Choisis {label}</Text>
          <PositionPicker sport={sport} selectedId={positionId} onSelect={setPositionId} />

          {position && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{position.nom}</Text>
              {!!position.description && <Text style={styles.infoText}>{position.description}</Text>}
              <View style={styles.axesRow}>
                {axes.map((a) => (
                  <View key={a} style={styles.axisChip}>
                    <Text style={styles.axisText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={[styles.section, { marginTop: 22 }]}>Programmes</Text>
          <View style={styles.levels}>
            {[{ key: null, label: "Tous niveaux" }, ...OZA_NIVEAUX].map((n) => {
              const on = niveau === n.key;
              return (
                <TouchableOpacity key={n.label} style={[styles.level, on && styles.levelOn]} onPress={() => setNiveau(n.key)}>
                  <Text style={[styles.levelText, on && { color: Colors.white }]}>{n.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {programs === null ? (
            <ActivityIndicator style={{ marginTop: 16 }} color={Colors.primary} />
          ) : visible.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="hourglass-outline" size={26} color={Colors.canard} />
              <Text style={styles.emptyTitle}>Programme à venir</Text>
              <Text style={styles.emptyText}>
                {position
                  ? `Le programme ${position.nom} est en cours de rédaction.`
                  : `Les programmes ${sport.nom} sont en cours de rédaction.`}
              </Text>
            </View>
          ) : (
            visible.map((p) => {
              const prog = userState?.progress[p.id];
              const pct = Math.round(programProgress(p, prog) * 100);
              return (
                <TouchableOpacity key={p.id} style={styles.programCard} activeOpacity={0.88} onPress={() => router.push(`${base}/programme/${p.id}` as never)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.programName}>{p.nom}</Text>
                    {!!p.objectif && <Text style={styles.programObjectif} numberOfLines={2}>{p.objectif}</Text>}
                    <Text style={styles.programMeta}>
                      {p.dureeSemaines} sem. · {p.seancesParSemaine} séances/sem. · {OZA_NIVEAUX.find((n) => n.key === p.niveau)?.label}
                    </Text>
                    {prog && (
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${pct}%` }]} />
                      </View>
                    )}
                  </View>
                  {userState?.favorites.includes(p.id) && <Ionicons name="star" size={16} color={Colors.riskMedium} />}
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { padding: 20 },
  section: { fontFamily: Type.heading, fontSize: 22, color: Colors.text, marginBottom: 12 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginTop: 14, borderWidth: 1, borderColor: Colors.border },
  infoTitle: { fontFamily: Type.heading, fontSize: 18, color: Colors.primaryDark },
  infoText: { fontSize: 13.5, color: Colors.textSecondary, marginTop: 4, lineHeight: 19 },
  axesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  axisChip: { backgroundColor: Colors.accentTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  axisText: { fontSize: 11.5, fontWeight: "700", color: Colors.primaryDark },
  levels: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  level: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  levelOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  levelText: { fontSize: 12.5, fontWeight: "700", color: Colors.text },
  empty: { alignItems: "center", gap: 6, backgroundColor: Colors.surface, borderRadius: 20, padding: 26, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { fontFamily: Type.heading, fontSize: 19, color: Colors.text },
  emptyText: { fontSize: 13.5, color: Colors.textSecondary, textAlign: "center" },
  programCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  programName: { fontSize: 16, fontWeight: "800", color: Colors.text },
  programObjectif: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  programMeta: { fontSize: 12, fontWeight: "600", color: Colors.canard, marginTop: 6 },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.grayLight, marginTop: 8, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: Colors.turquoise, borderRadius: 3 },
});
