import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

// Fonction serveur Vercel (voir api/coach-advice.ts) : la clé Anthropic n'est
// jamais dans l'app.
// Interrupteur du mini-coach IA. Désactivé tant que la clé ANTHROPIC_API_KEY n'est
// pas posée sur Vercel (voir docs/ia-mini-coach.md) : mettre true pour le réactiver.
export const AI_COACH_ENABLED = false;

export const COACH_API_URL = "https://oza-app-stable.vercel.app/api/coach-advice";

export type AiVerdict = "reprise" | "alleger" | "maintenir" | "progresser";

export type AiAdvice = {
  verdict: AiVerdict;
  titre: string;
  resume: string;
  actions: string[];
  adaptation: string;
  generatedAt: number;
};

export type AiPayload = {
  profile: {
    sport: string;
    poste: string | null;
    niveau: string | null;
    objectif: string | null;
    seancesParSemaine: number | null;
    dureeMinutes: number | null;
    materiel: string[];
    limitations: string | null;
  };
  stats: {
    seances7: number;
    seancesPrev7: number;
    charge7: number;
    rpe7: number | null;
    minutes7: number;
    acwr: number | null;
    bienEtre7: number | null;
    bienEtrePrev: number | null;
    semainesActives: number;
    tonnage7: number | null;
  };
  regle: { verdict: string; titre: string; raisons: string[] };
};

export class AiError extends Error {
  constructor(public code: string, message: string, public retryAt?: number) {
    super(message);
  }
}

// Dernier conseil généré (document écrit par le serveur, lecture seule ici).
export async function getAiAdvice(uid: string): Promise<AiAdvice | null> {
  const snap = await getDoc(doc(db, "coachAdvice", uid));
  const d = snap.data();
  if (!d || !d.resume || !d.generatedAt) return null;
  return {
    verdict: d.verdict,
    titre: d.titre,
    resume: d.resume,
    actions: d.actions ?? [],
    adaptation: d.adaptation ?? "",
    generatedAt: d.generatedAt,
  };
}

// Consentement explicite : le serveur refuse de générer sans lui.
export async function setAiConsent(uid: string, on: boolean): Promise<void> {
  await setDoc(doc(db, "sportProfiles", uid), { aiConsentAt: on ? Date.now() : null }, { merge: true });
}

export async function requestAiAdvice(payload: AiPayload): Promise<AiAdvice> {
  const user = auth.currentUser;
  if (!user) throw new AiError("unauthorized", "Connecte-toi pour utiliser le mini-coach.");
  const token = await user.getIdToken();

  let res: Response;
  try {
    res = await fetch(COACH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AiError("network", "Impossible de joindre le mini-coach. Vérifie ta connexion.");
  }

  const data = await res.json().catch(() => ({}));
  if (res.ok && data.advice) return { ...data.advice, generatedAt: data.generatedAt };

  switch (data.error) {
    case "not_configured":
      throw new AiError("not_configured", "Le mini-coach IA sera bientôt disponible.");
    case "consent_required":
      throw new AiError("consent_required", "Active d'abord le mini-coach IA.");
    case "rate_limited":
      throw new AiError("rate_limited", "Ton dernier conseil est encore récent.", data.retryAt);
    case "refused":
      throw new AiError("refused", data.message ?? "Le mini-coach n'a pas pu répondre.");
    default:
      throw new AiError("server", data.message ?? "Le mini-coach est momentanément indisponible.");
  }
}
