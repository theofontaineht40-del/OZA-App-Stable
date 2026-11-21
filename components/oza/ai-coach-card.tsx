import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius, Type } from "../../constants/tokens";
import {
  AiAdvice,
  AiError,
  AiPayload,
  AiVerdict,
  getAiAdvice,
  requestAiAdvice,
  setAiConsent,
} from "../../services/coach-ai";

const VERDICT_COLOR: Record<AiVerdict, string> = {
  reprise: Colors.primary,
  alleger: Colors.riskHigh,
  maintenir: Colors.riskMedium,
  progresser: Colors.riskLow,
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

// Mini-coach IA : conseil de la semaine personnalisé. Demande un consentement
// explicite (les données d'entraînement sont envoyées au service d'IA) puis
// affiche le dernier conseil et permet d'en générer un nouveau.
export default function AiCoachCard({
  uid,
  consent,
  payload,
}: {
  uid: string;
  consent: boolean;
  payload: AiPayload;
}) {
  const [on, setOn] = useState(consent);
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setOn(consent), [consent]);
  useEffect(() => {
    if (on) getAiAdvice(uid).then(setAdvice).catch(() => {});
  }, [uid, on]);

  async function activate() {
    setBusy(true);
    setError(null);
    try {
      await setAiConsent(uid, true);
      setOn(true);
    } catch {
      setError("Impossible d'enregistrer ton choix pour le moment.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    try {
      await setAiConsent(uid, false);
      setOn(false);
      setError(null);
    } catch {
      setError("Impossible d'enregistrer ton choix pour le moment.");
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      setAdvice(await requestAiAdvice(payload));
    } catch (e) {
      if (e instanceof AiError && e.code === "rate_limited" && e.retryAt) {
        setError(`Ton dernier conseil est encore récent. Prochain possible le ${formatDate(e.retryAt)}.`);
      } else {
        setError(e instanceof Error ? e.message : "Le mini-coach est momentanément indisponible.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={15} color={Colors.white} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.tag}>MINI-COACH IA</Text>
          <Text style={styles.title}>{on ? (advice ? advice.titre : "Ton conseil personnalisé") : "Un conseil rien que pour toi"}</Text>
        </View>
      </View>

      {!on ? (
        <>
          <Text style={styles.body}>
            Le mini-coach lit tes séances, ton bien-être et ton profil pour adapter ta semaine : charge, exercices, récupération.
          </Text>
          <Text style={styles.privacy}>
            En l'activant, ces données d'entraînement (sans ton nom ni ton email) sont envoyées à Anthropic pour rédiger le conseil. Tu peux le désactiver à tout moment.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={activate} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.ctaText}>Activer le mini-coach IA</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {advice ? (
            <>
              <View style={[styles.verdict, { backgroundColor: VERDICT_COLOR[advice.verdict] ?? Colors.primary }]}>
                <Text style={styles.verdictText}>{advice.verdict.toUpperCase()}</Text>
              </View>
              <Text style={styles.body}>{advice.resume}</Text>
              {advice.actions.map((a, i) => (
                <Text key={i} style={styles.action}>
                  {i + 1}. {a}
                </Text>
              ))}
              {!!advice.adaptation && (
                <View style={styles.adapt}>
                  <Text style={styles.adaptLabel}>Tes séances cette semaine</Text>
                  <Text style={styles.adaptText}>{advice.adaptation}</Text>
                </View>
              )}
              <Text style={styles.meta}>Généré le {formatDate(advice.generatedAt)}</Text>
            </>
          ) : (
            <Text style={styles.body}>Génère ton premier conseil : il prend en compte tes 7 derniers jours.</Text>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.cta} onPress={generate} disabled={busy} activeOpacity={0.85}>
            {busy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.ctaText}>{advice ? "Actualiser mon conseil" : "Générer mon conseil"}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            Conseil généré par IA d'après tes données. Il ne remplace ni ton coach ni un avis médical.
          </Text>
          <TouchableOpacity onPress={deactivate}>
            <Text style={styles.off}>Désactiver le mini-coach IA</Text>
          </TouchableOpacity>
        </>
      )}
      {!on && !!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  head: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  tag: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1, color: Colors.textSecondary },
  title: { fontFamily: Type.heading, fontSize: 19, color: Colors.text },
  body: { fontSize: 14, lineHeight: 21, color: Colors.text },
  privacy: { fontSize: 12, lineHeight: 17, color: Colors.textSecondary, marginTop: 8 },
  verdict: { alignSelf: "flex-start", borderRadius: Radius.pill, paddingVertical: 3, paddingHorizontal: 10, marginBottom: 8 },
  verdictText: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.8, color: Colors.white },
  action: { fontSize: 14, lineHeight: 21, fontWeight: "600", color: Colors.text, marginTop: 6 },
  adapt: { backgroundColor: Colors.accentTint, borderRadius: Radius.md, padding: 12, marginTop: 12 },
  adaptLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: Colors.canard, textTransform: "uppercase" },
  adaptText: { fontSize: 13.5, lineHeight: 20, color: Colors.text, marginTop: 3 },
  meta: { fontSize: 11.5, color: Colors.textSecondary, marginTop: 10 },
  error: { fontSize: 13, lineHeight: 18, color: Colors.riskHigh, marginTop: 10 },
  cta: { height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginTop: 14 },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  disclaimer: { fontSize: 11.5, lineHeight: 16, color: Colors.textSecondary, marginTop: 10 },
  off: { fontSize: 12.5, fontWeight: "700", color: Colors.canard, marginTop: 8 },
});
