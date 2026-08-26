import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { SportifRow, SportifStatus } from "../../services/coach-analytics";

const STATUS_LABEL: Record<SportifStatus, string> = {
  ok: "OK",
  vigilance: "Vigilance",
  attention: "Attention",
};

const STATUS_COLOR: Record<SportifStatus, string> = {
  ok: Colors.riskLow,
  vigilance: Colors.riskMedium,
  attention: Colors.riskHigh,
};

type SortKey = "name" | "wellness" | "load" | "status";

const STATUS_RANK: Record<SportifStatus, number> = { attention: 0, vigilance: 1, ok: 2 };

// Tableau central du dashboard coach : recherche + filtre par statut + tri,
// entièrement client-side sur les lignes déjà calculées (voir
// services/coach-analytics.ts buildSportifRow). La colonne "Adhérence"
// demandée par le design n'existe pas ici : rien dans le modèle de données
// actuel ne permet de calculer un taux de complétion des séances prévues.
export default function SportifsTable({
  rows,
  onPressRow,
}: {
  rows: SportifRow[];
  onPressRow: (uid: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SportifStatus | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => `${r.firstName} ${r.lastName}`.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    const sorted = [...result].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "wellness":
          return (b.wellnessScore ?? -1) - (a.wellnessScore ?? -1);
        case "load":
          return b.load7d - a.load7d;
        case "status":
        default:
          return STATUS_RANK[a.status] - STATUS_RANK[b.status];
      }
    });
    return sorted;
  }, [rows, search, statusFilter, sortKey]);

  const visible = expanded ? filtered : filtered.slice(0, 5);

  return (
    <View>
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

      <View style={styles.filterRow}>
        <FilterChip label="Tous" active={statusFilter === null} onPress={() => setStatusFilter(null)} />
        <FilterChip
          label="OK"
          active={statusFilter === "ok"}
          onPress={() => setStatusFilter("ok")}
          color={Colors.riskLow}
        />
        <FilterChip
          label="Vigilance"
          active={statusFilter === "vigilance"}
          onPress={() => setStatusFilter("vigilance")}
          color={Colors.riskMedium}
        />
        <FilterChip
          label="Attention"
          active={statusFilter === "attention"}
          onPress={() => setStatusFilter("attention")}
          color={Colors.riskHigh}
        />
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() =>
            setSortKey((k) => (k === "status" ? "wellness" : k === "wellness" ? "load" : k === "load" ? "name" : "status"))
          }
        >
          <Ionicons name="swap-vertical" size={14} color={Colors.primary} />
          <Text style={styles.sortButtonText}>
            {sortKey === "status" ? "Statut" : sortKey === "wellness" ? "Bien-être" : sortKey === "load" ? "Charge" : "Nom"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.nameCol]}>Sportif</Text>
        <Text style={[styles.headerCell, styles.numCol]}>Bien-être</Text>
        <Text style={[styles.headerCell, styles.numCol]}>Charge 7j</Text>
        <Text style={[styles.headerCell, styles.numCol]}>Tendance</Text>
        <Text style={[styles.headerCell, styles.statusCol]}>Statut</Text>
      </View>

      {visible.length === 0 ? (
        <Text style={styles.emptyText}>Aucun sportif ne correspond à cette recherche.</Text>
      ) : (
        visible.map((row) => (
          <TouchableOpacity key={row.uid} style={styles.row} onPress={() => onPressRow(row.uid)}>
            <View style={styles.nameCol}>
              <Text style={styles.nameText} numberOfLines={1}>
                {row.firstName} {row.lastName}
              </Text>
              <Text style={styles.lastSessionText}>
                {row.lastSessionDate ? `Dernière séance ${row.lastSessionDate}` : "Aucune séance loggée"}
              </Text>
            </View>
            <Text style={[styles.cellText, styles.numCol]}>
              {row.wellnessScore !== null ? row.wellnessScore.toFixed(1) : "—"}
            </Text>
            <Text style={[styles.cellText, styles.numCol]}>{row.load7d} UA</Text>
            <Text
              style={[
                styles.cellText,
                styles.numCol,
                row.loadDeltaPercent !== null && {
                  color: row.loadDeltaPercent >= 0 ? Colors.riskHigh : Colors.riskLow,
                  fontWeight: "700",
                },
              ]}
            >
              {row.loadDeltaPercent !== null
                ? `${row.loadDeltaPercent >= 0 ? "+" : ""}${Math.round(row.loadDeltaPercent)}%`
                : "—"}
            </Text>
            <View style={styles.statusCol}>
              <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[row.status]}1A` }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[row.status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLOR[row.status] }]}>
                  {STATUS_LABEL[row.status]}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {filtered.length > 5 && (
        <TouchableOpacity style={styles.showMoreButton} onPress={() => setExpanded((e) => !e)}>
          <Text style={styles.showMoreText}>
            {expanded ? "Réduire" : `Voir tous les sportifs (${filtered.length})`}
          </Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: color ?? Colors.primary, borderColor: color ?? Colors.primary }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.grayLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  chipTextActive: {
    color: Colors.white,
  },

  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  sortButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  headerRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },

  headerCell: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  nameCol: {
    flex: 2.2,
  },

  numCol: {
    flex: 1,
    textAlign: "right",
  },

  statusCol: {
    flex: 1.3,
    alignItems: "flex-end",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  nameText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  lastSessionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  cellText: {
    fontSize: 13,
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

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },

  showMoreButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
  },

  showMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
});
