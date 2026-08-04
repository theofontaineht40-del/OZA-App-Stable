import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ConfirmModal from "../../components/confirm-modal";
import DiscoverMap from "../../components/discover-map";
import { Colors } from "../../constants/colors";
import { DECOUVRIR_SPECIALITES, Specialite } from "../../constants/specialites";
import { auth, db } from "../../firebase";
import { CoachProfile, getDiscoverableCoaches } from "../../services/discovery";
import { geocodeVille } from "../../services/geocoding";
import { addSpecialiste, getRelationsForSportif } from "../../services/relations";
import { averageRating, getReviewsForCoach } from "../../services/reviews";
import { showAlert } from "../../utils/alert";

type CoachCard = CoachProfile & {
  rating: number;
  reviewCount: number;
  lat: number | null;
  lng: number | null;
};

export default function DecouvrirScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [ownFirstName, setOwnFirstName] = useState("");
  const [ownLastName, setOwnLastName] = useState("");
  const [coaches, setCoaches] = useState<CoachCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Specialite | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachCard | null>(null);
  const [linkedCoachIds, setLinkedCoachIds] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookedCoachName, setBookedCoachName] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);

      try {
        const [userSnap, coachData, relations] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDiscoverableCoaches(),
          getRelationsForSportif(user.uid),
        ]);
        if (userSnap.exists()) {
          setOwnFirstName(userSnap.data().firstName ?? "");
          setOwnLastName(userSnap.data().lastName ?? "");
        }
        setLinkedCoachIds(relations.map((r) => r.coachId));

        // Découvrir ne met en avant que les coachs sportifs (kiné, ostéo,
        // médecin du sport... restent accessibles via "Mon équipe" par code).
        const eligibleCoaches = coachData.filter((c) =>
          c.specialites.some((s) => DECOUVRIR_SPECIALITES.includes(s))
        );

        const withRatings = await Promise.all(
          eligibleCoaches.map(async (c) => {
            const [reviews, coords] = await Promise.all([
              getReviewsForCoach(c.uid),
              geocodeVille(c.ville),
            ]);
            return {
              ...c,
              rating: averageRating(reviews),
              reviewCount: reviews.length,
              lat: coords?.lat ?? null,
              lng: coords?.lng ?? null,
            };
          })
        );
        setCoaches(withRatings);
      } catch {
        // Lecture refusée : liste vide plutôt qu'un plantage.
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [loading]);

  const filtered = useMemo(() => {
    return coaches.filter((c) => {
      if (filter && !c.specialites.includes(filter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${c.firstName} ${c.lastName} ${c.ville} ${c.specialites.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [coaches, filter, search]);

  // Seuls les coachs dont la ville a pu être géolocalisée ont un point sur
  // la carte ; les autres restent trouvables via la recherche/le compteur.
  const mappable = useMemo(
    () => filtered.filter((c) => c.lat !== null && c.lng !== null),
    [filtered]
  );

  async function handleReserve(coach: CoachCard) {
    if (!uid) return;

    if (linkedCoachIds.includes(coach.uid)) {
      router.push(`/sportif/reservations`);
      return;
    }

    const specialite =
      coach.specialites.find((s) => DECOUVRIR_SPECIALITES.includes(s)) ??
      coach.specialites[0] ??
      null;
    if (!specialite) {
      showAlert("Indisponible", "Ce professionnel n'a pas encore renseigné de spécialité.");
      return;
    }

    setBooking(true);
    try {
      await addSpecialiste(
        uid,
        ownFirstName,
        ownLastName,
        coach.uid,
        coach.firstName,
        coach.lastName,
        specialite
      );
      setLinkedCoachIds((prev) => [...prev, coach.uid]);
      setBookedCoachName(coach.firstName);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedFlex, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trouver un coach</Text>
          <Text style={styles.subtitle}>
            {filtered.length} coach{filtered.length > 1 ? "s" : ""} disponible
            {filtered.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nom, ville, spécialité..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === null && styles.filterChipActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[styles.filterChipText, filter === null && styles.filterChipTextActive]}>
            Tout
          </Text>
        </TouchableOpacity>
        {DECOUVRIR_SPECIALITES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filter === s && styles.filterChipActive]}
            onPress={() => setFilter(filter === s ? null : s)}
          >
            <Text style={[styles.filterChipText, filter === s && styles.filterChipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.mapArea}>
        {filtered.length === 0 ? (
          <View style={styles.mapEmpty}>
            <Ionicons name="map-outline" size={32} color={Colors.grayMedium} />
            <Text style={styles.mapEmptyText}>Aucun coach ne correspond à ces filtres.</Text>
          </View>
        ) : (
          <DiscoverMap
            coaches={mappable.map((coach) => ({
              uid: coach.uid,
              lat: coach.lat as number,
              lng: coach.lng as number,
              label: coach.tarifHoraire ? `${coach.tarifHoraire} €/h` : coach.firstName,
            }))}
            selectedUid={selectedCoach?.uid ?? null}
            onSelect={(uid) => setSelectedCoach(filtered.find((c) => c.uid === uid) ?? null)}
          />
        )}
      </View>

      {selectedCoach && (
        <View style={styles.previewCard}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setSelectedCoach(null)}>
            <Ionicons name="close" size={16} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.previewHeader}>
            {selectedCoach.photoUrl ? (
              <Image source={{ uri: selectedCoach.photoUrl }} style={styles.previewPhoto} />
            ) : (
              <View style={styles.previewPhotoPlaceholder}>
                <Text style={styles.previewPhotoInitials}>
                  {`${selectedCoach.firstName[0] ?? ""}${selectedCoach.lastName[0] ?? ""}`.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>
                {selectedCoach.firstName} {selectedCoach.lastName}
              </Text>
              <View style={styles.previewMetaRow}>
                {selectedCoach.reviewCount > 0 ? (
                  <>
                    <Ionicons name="star" size={13} color={Colors.riskMedium} />
                    <Text style={styles.previewMetaText}>
                      {selectedCoach.rating.toFixed(1)} ({selectedCoach.reviewCount} avis)
                    </Text>
                  </>
                ) : (
                  <Text style={styles.previewMetaText}>Aucun avis pour l'instant</Text>
                )}
                {!!selectedCoach.ville && (
                  <Text style={styles.previewMetaText}> · {selectedCoach.ville}</Text>
                )}
              </View>
            </View>
            {selectedCoach.tarifHoraire && (
              <Text style={styles.previewPrice}>{selectedCoach.tarifHoraire} €/h</Text>
            )}
          </View>

          <View style={styles.previewChipsRow}>
            {selectedCoach.specialites.map((s) => (
              <View key={s} style={styles.previewChip}>
                <Text style={styles.previewChipText}>{s}</Text>
              </View>
            ))}
          </View>

          {!!selectedCoach.bio && <Text style={styles.previewBio}>{selectedCoach.bio}</Text>}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewMessageButton}
              onPress={() => router.push(`/sportif/messages/${selectedCoach.uid}`)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.previewReserveButton}
              onPress={() => handleReserve(selectedCoach)}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.previewReserveText}>
                  {linkedCoachIds.includes(selectedCoach.uid)
                    ? "Voir les disponibilités"
                    : "Réserver une séance"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      </Animated.View>

      <ConfirmModal
        visible={bookedCoachName !== null}
        title={`${bookedCoachName ?? ""} ajouté(e) à votre équipe`}
        message="Vous pouvez maintenant consulter ses disponibilités depuis Réservations."
        confirmLabel="Voir les disponibilités"
        cancelLabel="Plus tard"
        onConfirm={() => {
          setBookedCoachName(null);
          router.push("/sportif/reservations");
        }}
        onCancel={() => setBookedCoachName(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  animatedFlex: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  filterRow: {
    paddingHorizontal: 24,
    marginBottom: 12,
    flexGrow: 0,
  },

  filterChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  filterChipTextActive: {
    color: Colors.white,
  },

  mapArea: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: "#EFEDE8",
    position: "relative",
    overflow: "hidden",
  },

  mapEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 40,
  },

  mapEmptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  previewCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },

  previewClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  previewPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  previewPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  previewPhotoInitials: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 18,
  },

  previewName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  previewMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  previewPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },

  previewChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },

  previewChip: {
    backgroundColor: Colors.grayLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  previewChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text,
  },

  previewBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },

  previewActions: {
    flexDirection: "row",
    gap: 10,
  },

  previewMessageButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  previewReserveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  previewReserveText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
