import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../constants/colors";
import { Programme } from "../services/programmes";

type Props = {
  visible: boolean;
  defaultNom: string;
  sportifName: string;
  programmes: Programme[];
  loading: boolean;
  creating: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onSelect: (programme: Programme) => void;
};

export default function ProgrammeLinkModal({
  visible,
  defaultNom,
  sportifName,
  programmes,
  loading,
  creating,
  onClose,
  onCreateNew,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lier un programme</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createRow} onPress={onCreateNew} disabled={creating}>
          {creating ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color={Colors.primary} />
              <Text style={styles.createRowText}>
                Créer « {defaultNom} » pour {sportifName}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Programmes existants de {sportifName}</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {programmes.length === 0 ? (
              <Text style={styles.emptyText}>Aucun autre programme pour ce sportif.</Text>
            ) : (
              programmes.map((p) => (
                <TouchableOpacity key={p.id} style={styles.row} onPress={() => onSelect(p)}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="barbell" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{p.nom}</Text>
                    <Text style={styles.rowMeta}>
                      {p.seances.length} séance{p.seances.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    marginHorizontal: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  createRowText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    flex: 1,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    paddingHorizontal: 24,
    marginBottom: 12,
  },

  list: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF1F7",
    justifyContent: "center",
    alignItems: "center",
  },

  rowName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  rowMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
