import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AnimatedPressable from "../components/animated-pressable";
import GradientFill from "../components/gradient-fill";
import PhotoBackground from "../components/photo-background";
import { Colors } from "../constants/colors";
import { DEFAULT_OZA_SPORTS, OZA_NIVEAUX, OzaNiveau, OzaSport } from "../constants/oza-sports";
import {
  MaterielKey,
  ObjectifKey,
  PROFIL_DUREES_MIN,
  PROFIL_MATERIEL,
  PROFIL_OBJECTIFS,
  PROFIL_SEANCES_PAR_SEMAINE,
} from "../constants/onboarding";
import { Radius, Shadow, Type } from "../constants/tokens";
import { auth } from "../firebase";
import {
  AthleteProfile,
  EMPTY_ATHLETE_PROFILE,
  getAthleteProfile,
  saveAthleteProfile,
} from "../services/athlete-profile";
import { getOzaSports } from "../services/oza-programs";
import { showAlert } from "../utils/alert";

type StepKey = "sport" | "poste" | "niveau" | "objectif" | "dispo" | "materiel" | "limites";

const NIVEAU_HINTS: Record<OzaNiveau, string> = {
  debutant: "Je démarre ou je reprends après une longue pause",
  intermediaire: "Je m'entraîne régulièrement depuis plus d'un an",
  avance: "Je m'entraîne de façon structurée depuis plusieurs années",
};

// Questionnaire d'accueil : une question par écran, chacune peut être passée.
// Sert aussi à modifier son profil sportif (?edit=1).
export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ edit?: string }>();
  const editMode = params.edit === "1";

  const [uid, setUid] = useState<string | null>(null);
  const [sports, setSports] = useState<OzaSport[]>(DEFAULT_OZA_SPORTS.filter((s) => s.actif));
  const [profile, setProfile] = useState<AthleteProfile>(EMPTY_ATHLETE_PROFILE);
  const [aucuneLimite, setAucuneLimite] = useState(false);
  const [limiteTexte, setLimiteTexte] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      try {
        const [existing, catalogue] = await Promise.all([
          getAthleteProfile(user.uid),
          getOzaSports().catch(() => null),
        ]);
        if (catalogue) setSports(catalogue.filter((s) => s.actif));
        if (existing) {
          setProfile(existing);
          if (existing.limitations === "") setAucuneLimite(true);
          else if (existing.limitations) setLimiteTexte(existing.limitations);
        }
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const sport = useMemo(
    () => sports.find((s) => s.id === profile.sportId) ?? null,
    [sports, profile.sportId]
  );

  // L'étape "poste" n'existe que si le sport choisi en propose.
  const steps = useMemo<StepKey[]>(() => {
    const list: StepKey[] = ["sport"];
    if (sport && sport.positions.length > 0) list.push("poste");
    list.push("niveau", "objectif", "dispo", "materiel", "limites");
    return list;
  }, [sport]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;

  function patch(p: Partial<AthleteProfile>) {
    setProfile((prev) => ({ ...prev, ...p }));
  }

  function chooseSport(id: string) {
    // Changer de sport invalide le poste choisi pour l'ancien.
    patch({ sportId: id, positionId: id === profile.sportId ? profile.positionId : null });
  }

  function toggleMateriel(key: MaterielKey) {
    const has = profile.materiel.includes(key);
    patch({ materiel: has ? profile.materiel.filter((k) => k !== key) : [...profile.materiel, key] });
  }

  function canContinue(): boolean {
    switch (step) {
      case "sport":
        return !!profile.sportId;
      case "poste":
        return !!profile.positionId;
      case "niveau":
        return !!profile.niveau;
      case "objectif":
        return !!profile.objectif;
      case "dispo":
        return !!profile.seancesParSemaine;
      case "materiel":
        return profile.materiel.length > 0;
      case "limites":
        return aucuneLimite || limiteTexte.trim().length > 0;
    }
  }

  async function persist(completed: boolean) {
    if (!uid) return false;
    setSaving(true);
    try {
      const limitations = aucuneLimite ? "" : limiteTexte.trim() ? limiteTexte.trim() : null;
      await saveAthleteProfile(uid, { ...profile, limitations, completed });
      return true;
    } catch {
      showAlert("Erreur", "Impossible d'enregistrer ton profil pour le moment.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (!isLast) {
      setStepIndex(stepIndex + 1);
      return;
    }
    if (await persist(true)) {
      if (editMode) router.back();
      else setDone(true);
    }
  }

  function back() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else if (editMode) router.back();
  }

  // "Plus tard" : on garde ce qui est déjà répondu et on ne redemande pas.
  async function later() {
    if (await persist(false)) {
      if (editMode && router.canGoBack()) router.back();
      else router.replace("/sportif");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <PhotoBackground />
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={{ flex: 1 }}>
        <PhotoBackground />
        <View style={styles.doneWrap}>
          <View style={styles.doneBadge}>
            <GradientFill />
            <Ionicons name="checkmark" size={38} color={Colors.white} />
          </View>
          <Text style={styles.doneTitle}>Ton profil est prêt</Text>
          <Text style={styles.doneText}>
            {sport ? `OZA te propose maintenant des programmes ${sport.nom.toLowerCase()} adaptés à ton niveau.` : "OZA va te proposer des programmes adaptés."}
            {" "}Tu pourras modifier tes réponses à tout moment depuis ton profil.
          </Text>
          <AnimatedPressable
            style={[styles.cta, { width: "100%" }]}
            onPress={() => router.replace("/sportif/programmes")}
          >
            <GradientFill />
            <Text style={styles.ctaText}>Voir mes programmes</Text>
          </AnimatedPressable>
          <TouchableOpacity onPress={() => router.replace("/sportif")} style={styles.linkBtn}>
            <Text style={styles.linkText}>Aller à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = (stepIndex + 1) / steps.length;

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground />
      <View style={styles.shell}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={back}
            disabled={stepIndex === 0 && !editMode}
            style={[styles.iconBtn, stepIndex === 0 && !editMode && { opacity: 0 }]}
            accessibilityLabel="Retour"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.counter}>
            {stepIndex + 1} / {steps.length}
          </Text>
          <TouchableOpacity onPress={later} disabled={saving}>
            <Text style={styles.linkText}>Plus tard</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]}>
            <GradientFill />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {step === "sport" && (
            <>
              <Text style={styles.title}>Quel est ton sport ?</Text>
              <Text style={styles.subtitle}>
                OZA adapte les programmes et les indicateurs à ta discipline.
              </Text>
              <View style={styles.grid}>
                {sports.map((s) => {
                  const selected = s.id === profile.sportId;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.85}
                      onPress={() => chooseSport(s.id)}
                      style={[styles.sportTile, selected && { borderColor: s.couleurs.accent }]}
                    >
                      <LinearGradient
                        colors={[s.couleurs.from, s.couleurs.to]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
                      />
                      <LinearGradient
                        colors={["rgba(0,0,0,0)", "rgba(6,45,43,0.62)"]}
                        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
                      />
                      <Text style={styles.sportName}>{s.nom}</Text>
                      {selected && (
                        <View style={[styles.sportCheck, { backgroundColor: s.couleurs.accent }]}>
                          <Ionicons name="checkmark" size={14} color={Colors.primaryDark} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {step === "poste" && sport && (
            <>
              <Text style={styles.title}>
                {sport.positionLabel === "poste"
                  ? "Quel est ton poste ?"
                  : sport.positionLabel === "spécialité"
                    ? "Quelle est ta spécialité ?"
                    : sport.positionLabel === "axe"
                      ? "Sur quoi veux-tu travailler ?"
                      : "Quel est ton objectif principal ?"}
              </Text>
              <Text style={styles.subtitle}>Les programmes sont pensés poste par poste.</Text>
              {sport.positions.map((p) => (
                <Option
                  key={p.id}
                  label={p.nom}
                  hint={p.description}
                  selected={profile.positionId === p.id}
                  onPress={() => patch({ positionId: p.id })}
                />
              ))}
            </>
          )}

          {step === "niveau" && (
            <>
              <Text style={styles.title}>Quel est ton niveau ?</Text>
              <Text style={styles.subtitle}>Sois honnête : c'est ce qui rend le programme efficace.</Text>
              {OZA_NIVEAUX.map((n) => (
                <Option
                  key={n.key}
                  label={n.label}
                  hint={NIVEAU_HINTS[n.key]}
                  selected={profile.niveau === n.key}
                  onPress={() => patch({ niveau: n.key })}
                />
              ))}
            </>
          )}

          {step === "objectif" && (
            <>
              <Text style={styles.title}>Quel est ton objectif ?</Text>
              <Text style={styles.subtitle}>Choisis celui qui compte le plus en ce moment.</Text>
              {PROFIL_OBJECTIFS.map((o) => (
                <Option
                  key={o.key}
                  label={o.label}
                  hint={o.hint}
                  selected={profile.objectif === o.key}
                  onPress={() => patch({ objectif: o.key as ObjectifKey })}
                />
              ))}
            </>
          )}

          {step === "dispo" && (
            <>
              <Text style={styles.title}>Tes disponibilités</Text>
              <Text style={styles.subtitle}>Combien de séances peux-tu faire par semaine ?</Text>
              <View style={styles.chipRow}>
                {PROFIL_SEANCES_PAR_SEMAINE.map((n) => (
                  <Chip
                    key={n}
                    label={String(n)}
                    selected={profile.seancesParSemaine === n}
                    onPress={() => patch({ seancesParSemaine: n })}
                  />
                ))}
              </View>
              <Text style={[styles.subtitle, { marginTop: 22 }]}>Et combien de temps par séance ?</Text>
              <View style={styles.chipRow}>
                {PROFIL_DUREES_MIN.map((d) => (
                  <Chip
                    key={d}
                    label={`${d} min`}
                    selected={profile.dureeMinutes === d}
                    onPress={() => patch({ dureeMinutes: d })}
                  />
                ))}
              </View>
            </>
          )}

          {step === "materiel" && (
            <>
              <Text style={styles.title}>Ton matériel</Text>
              <Text style={styles.subtitle}>Coche tout ce dont tu disposes.</Text>
              {PROFIL_MATERIEL.map((m) => (
                <Option
                  key={m.key}
                  label={m.label}
                  hint={m.hint}
                  multi
                  selected={profile.materiel.includes(m.key)}
                  onPress={() => toggleMateriel(m.key)}
                />
              ))}
            </>
          )}

          {step === "limites" && (
            <>
              <Text style={styles.title}>Blessures ou limitations ?</Text>
              <Text style={styles.subtitle}>
                Douleur, ancienne blessure, mouvement à éviter… OZA en tient compte pour adapter ton
                programme. Ces informations ne remplacent pas un avis médical.
              </Text>
              <Option
                label="Aucune blessure ni limitation"
                selected={aucuneLimite}
                onPress={() => {
                  setAucuneLimite(true);
                  setLimiteTexte("");
                }}
              />
              <TextInput
                style={styles.textarea}
                placeholder="Ex. : genou droit fragile, douleur lombaire en squat…"
                placeholderTextColor={Colors.textSecondary}
                multiline
                value={limiteTexte}
                onChangeText={(t) => {
                  setLimiteTexte(t);
                  if (t) setAucuneLimite(false);
                }}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <AnimatedPressable
            style={[styles.cta, (!canContinue() || saving) && { opacity: 0.45 }]}
            onPress={() => {
              if (canContinue() && !saving) next();
            }}
          >
            <GradientFill />
            <Text style={styles.ctaText}>{isLast ? "Terminer" : "Continuer"}</Text>
          </AnimatedPressable>
          {step !== "sport" && (
            <TouchableOpacity
              onPress={() => (isLast ? next() : setStepIndex(stepIndex + 1))}
              disabled={saving}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Passer cette question</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function Option({
  label,
  hint,
  selected,
  multi,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  multi?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {!!hint && <Text style={styles.optionHint}>{hint}</Text>}
      </View>
      <View style={[styles.mark, multi && { borderRadius: 7 }, selected && styles.markOn]}>
        {selected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
      </View>
    </TouchableOpacity>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && { color: Colors.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingTop: 56,
    paddingHorizontal: 22,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary, letterSpacing: 0.5 },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: "hidden", marginBottom: 6 },
  fill: { height: 6, borderRadius: 3, overflow: "hidden" },
  body: { paddingTop: 22, paddingBottom: 24 },
  title: { fontFamily: Type.heading, fontSize: 30, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 21, color: Colors.textSecondary, marginBottom: 18 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sportTile: {
    width: "48.5%",
    height: 84,
    borderRadius: Radius.md,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  sportName: { fontFamily: Type.heading, fontSize: 17, color: Colors.white, textTransform: "uppercase" },
  sportCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    ...Shadow.card,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.accentTint },
  optionLabel: { fontSize: 16, fontWeight: "700", color: Colors.text },
  optionHint: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary, marginTop: 2 },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  markOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    minWidth: 64,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 16, fontWeight: "700", color: Colors.text },

  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
    textAlignVertical: "top",
  },

  footer: { paddingTop: 10, paddingBottom: 26 },
  cta: {
    overflow: "hidden",
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 17 },
  linkBtn: { alignItems: "center", paddingVertical: 12 },
  linkText: { color: Colors.canard, fontWeight: "700", fontSize: 14 },

  doneWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 14,
  },
  doneBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  doneTitle: { fontFamily: Type.heading, fontSize: 32, color: Colors.text, textAlign: "center" },
  doneText: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary, textAlign: "center", marginBottom: 10 },
});
