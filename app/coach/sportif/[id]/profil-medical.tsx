import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import { BodyChart } from "../../../../components/body-chart";
import { AGE_BRACKETS, SEXES } from "../../../../constants/athlete-segments";
import { BODY_ZONES, BodyView } from "../../../../constants/body-zones";
import { Colors } from "../../../../constants/colors";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";
import {
  addInjury,
  addPainPoint,
  getInjuries,
  getMedicalProfile,
  getPainPoints,
  Injury,
  latestIntensityByZone,
  PainPoint,
  updateMedicalProfile,
} from "../../../../services/medical";

export default function ProfilMedicalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [antecedents, setAntecedents] = useState("");
  const [pathologies, setPathologies] = useState("");
  const [sexe, setSexe] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [view, setView] = useState<BodyView>("face");
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [painNotes, setPainNotes] = useState("");

  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [showInjuryForm, setShowInjuryForm] = useState(false);
  const [injuryZone, setInjuryZone] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [injuryGravite, setInjuryGravite] = useState(3);
  const [injuryStatut, setInjuryStatut] = useState<"active" | "guerie">("active");
  const [injuryNotes, setInjuryNotes] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [profile, points, injuryList] = await Promise.all([
        getMedicalProfile(id),
        getPainPoints(id),
        getInjuries(id),
      ]);
      setAntecedents(profile.antecedents);
      setPathologies(profile.pathologies);
      setSexe(profile.sexe);
      setAgeBracket(profile.ageBracket);
      setPainPoints(points);
      setInjuries(injuryList);
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleSaveProfile() {
    if (!id) return;
    setSavingProfile(true);
    try {
      await updateMedicalProfile(id, { antecedents, pathologies, sexe, ageBracket });
    } finally {
      setSavingProfile(false);
    }
  }

  function selectZone(zoneKey: string) {
    setSelectedZone(zoneKey);
    const existing = latestIntensityByZone(painPoints)[zoneKey];
    setIntensity(existing ?? 5);
    setPainNotes("");
  }

  async function handleSavePain() {
    if (!id || !selectedZone) return;
    await addPainPoint(id, { zone: selectedZone, view, intensity, notes: painNotes });
    const points = await getPainPoints(id);
    setPainPoints(points);
    setSelectedZone(null);
  }

  async function handleAddInjury() {
    if (!id || !injuryZone || !injuryType) return;
    await addInjury(id, {
      zone: injuryZone,
      type: injuryType,
      gravite: injuryGravite,
      statut: injuryStatut,
      notes: injuryNotes,
    });
    const list = await getInjuries(id);
    setInjuries(list);
    setShowInjuryForm(false);
    setInjuryZone("");
    setInjuryType("");
    setInjuryGravite(3);
    setInjuryStatut("active");
    setInjuryNotes("");
  }

  const isPrincipal = usePrincipalAccess(id);

  if (loading || isPrincipal === null) {
    return <View style={styles.container} />;
  }

  if (!isPrincipal) {
    return <AccessDenied message="Le dossier médical n'est visible que par le coach principal." />;
  }

  const intensityByZone = latestIntensityByZone(painPoints);
  const selectedZoneLabel = BODY_ZONES.find((z) => z.key === selectedZone)?.label ?? "";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Profil médical</Text>

      <Text style={styles.sectionTitle}>Profil général</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Sexe</Text>
        <View style={styles.viewToggle}>
          {SEXES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.toggleButton, sexe === s.key && styles.toggleButtonActive]}
              onPress={() => setSexe(s.key)}
            >
              <Text style={[styles.toggleText, sexe === s.key && styles.toggleTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Tranche d'âge</Text>
        <View style={styles.ageRow}>
          {AGE_BRACKETS.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[styles.ageChip, ageBracket === a.key && styles.toggleButtonActive]}
              onPress={() => setAgeBracket(a.key)}
            >
              <Text style={[styles.toggleText, ageBracket === a.key && styles.toggleTextActive]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Antécédents sportifs</Text>
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.textArea}
          multiline
          placeholder="Ex : entorse cheville droite 2023, tendinite rotulienne..."
          value={antecedents}
          onChangeText={setAntecedents}
        />

        <Text style={styles.fieldLabel}>Pathologies</Text>
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.textArea}
          multiline
          placeholder="Ex : asthme d'effort, aucune..."
          value={pathologies}
          onChangeText={setPathologies}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Cartographie des douleurs</Text>
      <View style={styles.card}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, view === "face" && styles.toggleButtonActive]}
            onPress={() => {
              setView("face");
              setSelectedZone(null);
            }}
          >
            <Text style={[styles.toggleText, view === "face" && styles.toggleTextActive]}>
              Face
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, view === "dos" && styles.toggleButtonActive]}
            onPress={() => {
              setView("dos");
              setSelectedZone(null);
            }}
          >
            <Text style={[styles.toggleText, view === "dos" && styles.toggleTextActive]}>
              Dos
            </Text>
          </TouchableOpacity>
        </View>

        <BodyChart
          view={view}
          intensityByZone={intensityByZone}
          selectedZone={selectedZone}
          onSelectZone={selectZone}
        />

        {selectedZone && (
          <View style={styles.painForm}>
            <Text style={styles.fieldLabel}>{selectedZoneLabel}</Text>
            <View style={styles.scaleRow}>
              {Array.from({ length: 11 }, (_, i) => i).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.scaleDot, intensity === value && styles.scaleDotActive]}
                  onPress={() => setIntensity(value)}
                >
                  <Text
                    style={[
                      styles.scaleDotText,
                      intensity === value && styles.scaleDotTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
  placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              placeholder="Notes (optionnel)"
              value={painNotes}
              onChangeText={setPainNotes}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSavePain}>
              <Text style={styles.primaryButtonText}>Enregistrer la douleur</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Blessures</Text>
        <TouchableOpacity onPress={() => setShowInjuryForm((v) => !v)}>
          <Ionicons
            name={showInjuryForm ? "close-circle" : "add-circle"}
            size={26}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {showInjuryForm && (
        <View style={styles.card}>
          <TextInput
  placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            placeholder="Zone (ex : genou droit)"
            value={injuryZone}
            onChangeText={setInjuryZone}
          />
          <TextInput
  placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            placeholder="Type de blessure (ex : entorse, tendinite)"
            value={injuryType}
            onChangeText={setInjuryType}
          />

          <Text style={styles.fieldLabel}>Gravité</Text>
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.scaleDot, injuryGravite === value && styles.scaleDotActive]}
                onPress={() => setInjuryGravite(value)}
              >
                <Text
                  style={[
                    styles.scaleDotText,
                    injuryGravite === value && styles.scaleDotTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                injuryStatut === "active" && styles.toggleButtonActive,
              ]}
              onPress={() => setInjuryStatut("active")}
            >
              <Text
                style={[
                  styles.toggleText,
                  injuryStatut === "active" && styles.toggleTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                injuryStatut === "guerie" && styles.toggleButtonActive,
              ]}
              onPress={() => setInjuryStatut("guerie")}
            >
              <Text
                style={[
                  styles.toggleText,
                  injuryStatut === "guerie" && styles.toggleTextActive,
                ]}
              >
                Guérie
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
  placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            placeholder="Notes (optionnel)"
            value={injuryNotes}
            onChangeText={setInjuryNotes}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleAddInjury}>
            <Text style={styles.primaryButtonText}>Ajouter la blessure</Text>
          </TouchableOpacity>
        </View>
      )}

      {injuries.length === 0 ? (
        <Text style={styles.emptyText}>Aucune blessure enregistrée.</Text>
      ) : (
        injuries.map((injury) => (
          <View key={injury.id} style={styles.injuryRow}>
            <View style={styles.injuryInfo}>
              <Text style={styles.injuryZone}>
                {injury.zone} — {injury.type}
              </Text>
              <Text style={styles.injuryDetail}>
                {injury.date} · Gravité {injury.gravite}/5
              </Text>
              {!!injury.notes && <Text style={styles.injuryNotes}>{injury.notes}</Text>}
            </View>
            <View
              style={[
                styles.statusBadge,
                injury.statut === "active" ? styles.statusActive : styles.statusHealed,
              ]}
            >
              <Text style={styles.statusText}>
                {injury.statut === "active" ? "Active" : "Guérie"}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
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

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },

  textArea: {
    color: Colors.text,
    minHeight: 70,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: "top",
  },

  input: {
    color: Colors.text,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 12,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  viewToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  ageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  ageChip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  toggleButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  toggleTextActive: {
    color: Colors.white,
  },

  painForm: {
    marginTop: 16,
  },

  scaleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  scaleDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  scaleDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  scaleDotText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  scaleDotTextActive: {
    color: Colors.white,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 12,
  },

  injuryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  injuryInfo: {
    flex: 1,
    paddingRight: 10,
  },

  injuryZone: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  injuryDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  injuryNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusActive: {
    backgroundColor: "#FFEDEB",
  },

  statusHealed: {
    backgroundColor: "#EAFAF0",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
  },
});
