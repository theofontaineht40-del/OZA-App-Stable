import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import PhotoBackground from "../../../components/photo-background";
import { Colors } from "../../../constants/colors";
import { auth } from "../../../firebase";
import {
  CARDIO_REFS,
  CardioReferences,
  describeSegment,
  describeSpec,
  getCardioReferences,
  targetFor,
} from "../../../services/cardio";
import { getScheduledForSportif, ScheduledSession } from "../../../services/schedule";

// Détail d'une séance cardio posée par le coach : chaque segment avec sa
// cible concrète (km/h, W ou bpm) quand la référence du sportif est connue.
export default function SportifCardioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ScheduledSession | null | undefined>(undefined);
  const [refs, setRefs] = useState<CardioReferences>({ vma: null, pma: null, fcMax: null });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user || !id) return;
      try {
        const all = await getScheduledForSportif(user.uid);
        setItem(all.find((i) => i.id === id) ?? null);
      } catch {
        setItem(null);
      }
      try {
        setRefs(await getCardioReferences(user.uid));
      } catch {
        // Sans références, on affiche seulement les pourcentages.
      }
    });
  }, [id]);

  const spec = item?.cardio;
  const refInfo = spec ? CARDIO_REFS.find((r) => r.key === spec.ref) : null;
  const hasRef = spec
    ? (spec.ref === "vma" ? refs.vma : spec.ref === "pma" ? refs.pma : refs.fcMax) !== null
    : false;

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="programmes" />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textOnDark} />
        </TouchableOpacity>

        {item === undefined ? (
          <ActivityIndicator color={Colors.white} />
        ) : !item || !spec ? (
          <Text style={styles.empty}>Cette séance n'est plus disponible.</Text>
        ) : (
          <>
            <Text style={styles.title}>{item.titre}</Text>
            <Text style={styles.subtitle}>
              {item.date} · {describeSpec(spec)}
            </Text>

            {!hasRef && refInfo && (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Ton coach n'a pas encore renseigné ta {refInfo.label.replace("% ", "")} :
                  seuls les pourcentages sont affichés.
                </Text>
              </View>
            )}

            {spec.segments.map((seg, i) => {
              const effort = targetFor(spec.ref, seg.effortPct, refs);
              const recup = seg.recupSec > 0 ? targetFor(spec.ref, seg.recupPct, refs) : null;
              return (
                <View key={i} style={styles.segCard}>
                  <Text style={styles.segText}>{describeSegment(seg)}</Text>
                  {(effort || recup) && (
                    <Text style={styles.segTarget}>
                      {effort ? `Effort : ${effort}` : ""}
                      {effort && recup ? "  ·  " : ""}
                      {recup ? `Récup : ${recup}` : ""}
                    </Text>
                  )}
                </View>
              );
            })}

            <TouchableOpacity style={styles.cta} onPress={() => router.push("/sportif/nouvelle-seance")}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.ctaText}>J'ai terminé — enregistrer ma séance</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 70, paddingBottom: 80 },
  back: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.textOnDark },
  subtitle: { fontSize: 13, color: Colors.textOnDarkSecondary, marginTop: 4, marginBottom: 16 },
  empty: { color: Colors.textOnDarkSecondary, fontSize: 14 },
  notice: { backgroundColor: Colors.accentTint, borderRadius: 14, padding: 12, marginBottom: 14 },
  noticeText: { fontSize: 12, color: Colors.text, lineHeight: 17 },
  segCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10 },
  segText: { fontSize: 15, fontWeight: "700", color: Colors.text },
  segTarget: { fontSize: 13, color: Colors.primary, fontWeight: "600", marginTop: 6 },
  cta: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 16,
    marginTop: 16,
  },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
