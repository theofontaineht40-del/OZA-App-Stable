import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { getRoutine, Routine, routineFrequenceLabel } from "../services/routines";
import { RoutineExerciseList } from "./routine-card";

// Routine attitrée vue par le sportif :
//  - "home"   : carte sur l'accueil, toujours affichée s'il en a une ;
//  - "seance" : en tête d'une séance, seulement si le coach l'a cochée
//               "avant chaque séance".
// Repliable pour ne pas pousser la séance trop bas.
export default function SportifRoutine({ sportifId, mode }: { sportifId: string; mode: "home" | "seance" }) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [open, setOpen] = useState(mode === "seance");

  useEffect(() => {
    let cancelled = false;
    // Un échec (règles pas encore publiées, hors ligne…) ne doit jamais
    // bloquer l'accueil ou la séance : on n'affiche simplement rien.
    getRoutine(sportifId)
      .then((r) => !cancelled && setRoutine(r))
      .catch(() => !cancelled && setRoutine(null));
    return () => {
      cancelled = true;
    };
  }, [sportifId]);

  if (!routine || routine.exercices.length === 0) return null;
  if (mode === "seance" && !routine.avantSeance) return null;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <View style={styles.iconWrap}>
          <Ionicons name="body-outline" size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{mode === "seance" ? "Avant de commencer" : "Ta routine"}</Text>
          <Text style={styles.title}>{routine.nom}</Text>
          <Text style={styles.meta}>
            {routine.exercices.length} exercice{routine.exercices.length > 1 ? "s" : ""} ·{" "}
            {mode === "seance" ? "à faire avant la séance" : routineFrequenceLabel(routine)}
          </Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={styles.body}>
          <RoutineExerciseList routine={routine} />
          {routine.exercices.some((e) => e.commentaires) && (
            <View style={{ marginTop: 8, gap: 4 }}>
              {routine.exercices
                .filter((e) => e.commentaires)
                .map((e) => (
                  <Text key={e.id} style={styles.comment}>
                    {e.exerciceNom} : {e.commentaires}
                  </Text>
                ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentTint,
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: { fontSize: 11, fontWeight: "700", color: Colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 15, fontWeight: "700", color: Colors.text, marginTop: 1 },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  body: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.grayLight },
  comment: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});
