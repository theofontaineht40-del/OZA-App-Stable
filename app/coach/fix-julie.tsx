import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
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

import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { getPlanification, Planification, savePlanification } from "../../services/planification";
import { assignProgrammeToSportif, getProgrammesForCoach, Programme } from "../../services/programmes";
import { deleteManagedSportif, getRelation } from "../../services/relations";
import {
  addWellnessEntry,
  getMySportifs,
  getWellnessForCoach,
  SportifSummary,
  WellnessEntry,
} from "../../services/tracking";
import { showAlert } from "../../utils/alert";

type Role = "none" | "source" | "target" | "delete";

type Candidate = SportifSummary & {
  wellnessCount: number;
  hasPlanification: boolean;
  programmeCount: number;
  role: Role;
};

// Écran d'admin permanent (accès masqué de la navigation, voir
// app/coach/_layout.tsx) pour nettoyer les doublons de profil — cas
// récurrent : un coach crée un profil "géré" (senior sans compte, ou avant
// que la personne s'inscrive elle-même), puis un vrai compte auto-inscrit
// finit par exister pour la même personne. On tape un bout de nom, on
// désigne qui est quoi, puis :
//  - "source" (profil avec les données/programmes à conserver) → sa
//    planification, son historique de bien-être et TOUS ses programmes sont
//    transférés vers "target", puis le profil source est supprimé ;
//  - "target" (généralement le vrai compte) → destination, jamais écrasé :
//    un check-in déjà présent à une date donnée n'est jamais remplacé ;
//  - "delete" (profil géré vide, sans rapport avec le transfert) → supprimé
//    directement, sans copie.
export default function FixDuplicatesScreen() {
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [allSportifs, setAllSportifs] = useState<SportifSummary[] | null>(null);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setCoachUid(user.uid);
      try {
        const [sportifs, wellnessData, programmeData] = await Promise.all([
          getMySportifs(user.uid),
          getWellnessForCoach(user.uid),
          getProgrammesForCoach(user.uid),
        ]);
        setAllSportifs(sportifs);
        setWellness(wellnessData);
        setProgrammes(programmeData);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : String(error));
      }
    });
    return unsubscribe;
  }, []);

  // Reconstruit les candidats (avec leurs compteurs) à chaque changement de
  // recherche ou de données, plutôt qu'une requête réseau par frappe.
  useEffect(() => {
    if (!allSportifs) return;
    const term = search.trim().toLowerCase();
    if (term.length < 2) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const matches = allSportifs.filter((s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(term)
      );
      const withCounts = await Promise.all(
        matches.map(async (s) => {
          // La lecture de /planifications exige un lien "coach principal"
          // formellement enregistré (relations/{sportifId}_{coachId}) — un
          // vrai compte lié via l'ancien système (users.coachId seul,
          // jamais migré faute d'avoir ouvert son suivi) n'en a pas encore
          // et fait échouer cette lecture. On dégrade proprement plutôt
          // que de bloquer tout l'écran : ce champ n'est qu'indicatif.
          let hasPlanification = false;
          try {
            const planification = await getPlanification(s.uid);
            hasPlanification = planification.blocks.length > 0 || !!planification.startDate;
          } catch {
            // ignoré, voir commentaire ci-dessus
          }
          return {
            ...s,
            wellnessCount: wellness.filter((w) => w.sportifId === s.uid).length,
            hasPlanification,
            programmeCount: programmes.filter((p) => p.sportifId === s.uid).length,
            role: "none" as Role,
          };
        })
      );
      if (!cancelled) setCandidates(withCounts);
    })();
    return () => {
      cancelled = true;
    };
  }, [search, allSportifs, wellness, programmes]);

  function setRole(uid: string, role: Role) {
    setCandidates((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, role } : c.role === role ? { ...c, role: "none" } : c))
    );
  }

  async function handleRun() {
    if (!coachUid) return;
    const source = candidates.find((c) => c.role === "source");
    const target = candidates.find((c) => c.role === "target");
    const toDelete = candidates.filter((c) => c.role === "delete");

    if (!source && !target && toDelete.length === 0) {
      showAlert("Rien à faire", "Assignez au moins un rôle avant de lancer.");
      return;
    }
    if ((source && !target) || (!source && target)) {
      showAlert("Rôles incomplets", "Il faut à la fois une source et une cible pour transférer les données.");
      return;
    }

    setRunning(true);
    try {
      if (source && target) {
        // La cible peut être un vrai compte lié via l'ancien système
        // (users.coachId seul, jamais formalisé en relations/{id} faute
        // d'avoir ouvert son suivi) : on matérialise le lien "principal"
        // maintenant, sinon les écritures ci-dessous échouent faute de
        // isPrincipalOf(target) — voir firestore.rules /relations.
        await getRelation(target.uid, coachUid);
        const targetName = `${target.firstName} ${target.lastName}`.trim();

        // Programmes : réassignation directe (pas de copie), c'est un
        // changement de propriétaire, pas une donnée à dupliquer.
        const sourceProgrammes = programmes.filter((p) => p.sportifId === source.uid);
        for (const p of sourceProgrammes) {
          await assignProgrammeToSportif(p.id, target.uid, targetName);
        }

        const planification: Planification = await getPlanification(source.uid);
        if (planification.blocks.length > 0 || planification.startDate) {
          await savePlanification(target.uid, planification);
        }

        const allWellness = await getWellnessForCoach(coachUid);
        const sourceEntries = allWellness.filter((w) => w.sportifId === source.uid);
        // La cible peut déjà avoir ses propres check-ins réels (saisis par
        // elle-même) : addWellnessEntry écrase le document du jour
        // (setDoc sans merge), donc on ne recopie jamais par-dessus une date
        // où elle a déjà une entrée à elle — on garde la sienne, quitte à
        // perdre la valeur importée pour ce jour précis.
        const targetDates = new Set(
          allWellness.filter((w) => w.sportifId === target.uid).map((w) => w.date)
        );
        let skipped = 0;
        for (const entry of sourceEntries) {
          if (targetDates.has(entry.date)) {
            skipped++;
            continue;
          }
          await addWellnessEntry(
            target.uid,
            {
              sommeil: entry.sommeil,
              fatigue: entry.fatigue,
              courbatures: entry.courbatures,
              stress: entry.stress,
            },
            coachUid,
            undefined,
            entry.date
          );
        }
        if (skipped > 0) {
          showAlert(
            "Attention",
            `${skipped} check-in(s) ignoré(s) car la cible avait déjà une entrée réelle à ces dates (conservée telle quelle).`
          );
        }

        // La suppression de /planifications exige isPrincipalOf(source), donc
        // avant de retirer la relation (deleteManagedSportif la supprime).
        await deleteDoc(doc(db, "planifications", source.uid));
        await deleteManagedSportif(source.uid, coachUid);
      }

      for (const c of toDelete) {
        await deleteManagedSportif(c.uid, coachUid);
      }

      showAlert("Terminé", "Fusion et nettoyage effectués.");
      router.replace("/coach/sportifs");
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Fusionner des profils en doublon</Text>
      <Text style={styles.subtitle}>
        Tape un nom pour retrouver les profils concernés, puis désigne qui est quoi.
      </Text>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Nom ou prénom (ex. Lagarde)"
        placeholderTextColor={Colors.textSecondary}
        autoCapitalize="none"
      />

      {loadError ? (
        <Text style={styles.errorText}>Erreur : {loadError}</Text>
      ) : !allSportifs ? (
        <ActivityIndicator color={Colors.primary} />
      ) : search.trim().length < 2 ? (
        <Text style={styles.line}>Tape au moins 2 lettres.</Text>
      ) : candidates.length === 0 ? (
        <Text style={styles.line}>Aucun profil trouvé pour "{search.trim()}".</Text>
      ) : (
        candidates.map((c) => (
          <View key={c.uid} style={styles.card}>
            <Text style={styles.cardTitle}>
              {c.firstName} {c.lastName} {c.managed ? "· Profil géré" : "· Vrai compte"}
            </Text>
            <Text style={styles.cardMeta}>
              {c.programmeCount} programme{c.programmeCount > 1 ? "s" : ""} · {c.wellnessCount} check-in
              {c.wellnessCount > 1 ? "s" : ""} de bien-être ·{" "}
              {c.hasPlanification ? "planification présente" : "pas de planification"}
            </Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleChip, c.role === "source" && styles.roleChipSource]}
                onPress={() => setRole(c.uid, c.role === "source" ? "none" : "source")}
              >
                <Text style={[styles.roleChipText, c.role === "source" && styles.roleChipTextActive]}>
                  Source (a les données)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleChip, c.role === "target" && styles.roleChipTarget]}
                onPress={() => setRole(c.uid, c.role === "target" ? "none" : "target")}
              >
                <Text style={[styles.roleChipText, c.role === "target" && styles.roleChipTextActive]}>
                  Cible (à garder)
                </Text>
              </TouchableOpacity>
              {c.managed && (
                <TouchableOpacity
                  style={[styles.roleChip, c.role === "delete" && styles.roleChipDelete]}
                  onPress={() => setRole(c.uid, c.role === "delete" ? "none" : "delete")}
                >
                  <Text style={[styles.roleChipText, c.role === "delete" && styles.roleChipTextActive]}>
                    Supprimer (vide)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}

      {candidates.length > 0 && (
        <TouchableOpacity style={styles.runButton} onPress={handleRun} disabled={running}>
          {running ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.runButtonText}>Lancer</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backText: { fontSize: 14, color: Colors.text, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  searchInput: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 20,
  },
  line: { fontSize: 14, color: Colors.text },
  errorText: { fontSize: 13, color: Colors.riskHigh },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
  },
  roleChipSource: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleChipTarget: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  roleChipDelete: { backgroundColor: Colors.riskHigh, borderColor: Colors.riskHigh },
  roleChipText: { fontSize: 12, fontWeight: "600", color: Colors.text },
  roleChipTextActive: { color: Colors.white },
  runButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  runButtonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
