import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { resolveExerciseMuscles } from "../../constants/exercise-muscles";
import { MUSCLE_LABELS } from "../../constants/muscle-groups";
import { MUSCLE_GROUP_ZONES } from "../../constants/muscle-paths";
import { Radius } from "../../constants/tokens";
import { todayKey } from "../../services/load";
import {
  RECOVERY_LABELS,
  RecoveryState,
  computeMuscleRecovery,
  daysLabel,
} from "../../services/muscle-recovery";
import { SessionRecord } from "../../services/tracking";
import MuscleMapDetailed from "../muscle-map-detailed";

const STATE_COLOR: Record<RecoveryState, string> = {
  sollicite: Colors.riskHigh,
  recuperation: Colors.riskMedium,
  frais: Colors.riskLow,
  oublie: "rgba(11, 31, 30, 0.28)",
};

const LEGEND: RecoveryState[] = ["sollicite", "recuperation", "frais"];

// Carte du corps : quels muscles sont encore sollicités, en récupération ou
// frais, d'après les exercices des séances enregistrées. Repère indicatif
// fondé sur les jours écoulés (voir services/muscle-recovery.ts).
export default function MuscleRecoveryCard({ sessions }: { sessions: SessionRecord[] }) {
  const rows = useMemo(
    () => computeMuscleRecovery(sessions, (name) => resolveExerciseMuscles({ name }), todayKey()),
    [sessions],
  );

  const { zoneColors, activeZones } = useMemo(() => {
    const colors: Record<string, string> = {};
    for (const r of rows) {
      for (const zone of MUSCLE_GROUP_ZONES[r.group] ?? []) colors[zone] = STATE_COLOR[r.state];
    }
    return { zoneColors: colors, activeZones: new Set(Object.keys(colors)) };
  }, [rows]);

  // Rien à montrer tant qu'aucun exercice n'a été enregistré : pas de carte vide.
  if (rows.length === 0) return null;

  return (
    <View style={styles.block}>
      <Text style={styles.title}>Tes muscles</Text>
      <Text style={styles.sub}>Où en est la récupération, d'après tes dernières séances.</Text>

      <View style={styles.row}>
        <View style={styles.mapWrap}>
          <MuscleMapDetailed activeZones={activeZones} zoneColors={zoneColors} width={140} />
        </View>

        <View style={styles.list}>
          {rows.map((r) => (
            <View key={r.group} style={styles.item}>
              <View style={[styles.dot, { backgroundColor: STATE_COLOR[r.state] }]} />
              <Text style={styles.itemName} numberOfLines={1}>
                {MUSCLE_LABELS[r.group]}
              </Text>
              <Text style={styles.itemWhen}>{daysLabel(r.daysSince)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        {LEGEND.map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: STATE_COLOR[s] }]} />
            <Text style={styles.legendText}>{RECOVERY_LABELS[s]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        Repère indicatif : sollicité jusqu'à 1 jour après la séance, en récupération à 2 jours, frais ensuite. Écoute aussi tes sensations ; ce n'est pas un avis médical.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 13, fontWeight: "700", color: Colors.text },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 12 },
  mapWrap: { alignItems: "center", justifyContent: "center", backgroundColor: Colors.background, borderRadius: Radius.md, padding: 10 },
  list: { flex: 1, minWidth: 160, gap: 7 },
  item: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemName: { flex: 1, minWidth: 0, fontSize: 13.5, color: Colors.text },
  itemWhen: { fontSize: 12, color: Colors.textSecondary, flexShrink: 0 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 11.5, color: Colors.textSecondary },
  note: { fontSize: 11, color: Colors.textSecondary, marginTop: 8, lineHeight: 15 },
});
