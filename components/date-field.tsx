import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";

import { Colors } from "../constants/colors";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return `${d} ${MOIS[m - 1]} ${y}`;
}

// Native (iOS/Android) : le TextInput libre laissait taper des dates invalides
// ("32-13-2026") sans jamais le signaler — le sélecteur natif rend ça impossible.
export default function DateField({ value, onChange, placeholder }: Props) {
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(`${value}T00:00:00`) : new Date();

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    setShow(Platform.OS === "ios");
    if (event.type === "set" && selected) {
      onChange(toISODate(selected));
    }
  }

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? formatDisplay(value) : placeholder ?? "Choisir une date"}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  valueText: {
    fontSize: 14,
    color: Colors.text,
  },

  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
