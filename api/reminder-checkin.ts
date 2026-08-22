import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Fonction Vercel indépendante d'Expo Router (export web "static", donc pas
// de vraies routes API côté app) : tout fichier sous /api à la racine
// devient automatiquement une fonction serverless Node, quel que soit le
// framework du reste du projet.
//
// Déclenchée une fois par jour par le cron Vercel (voir vercel.json) :
// envoie un rappel par email à chaque sportif qui n'a pas encore rempli son
// check-in du jour dans la collection `wellness`.

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON manquante");
  }
  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}

async function sendReminderEmail(to: string, firstName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquante");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OZA <onboarding@resend.dev>",
      to: [to],
      subject: "N'oublie pas ton check-in du jour 👋",
      html: `<p>Bonjour ${firstName || ""},</p>
        <p>Tu n'as pas encore renseigné ton check-in du jour sur OZA (sommeil, énergie, récupération...).</p>
        <p>Ça prend 30 secondes et ça aide ton coach à ajuster tes séances.</p>
        <p><a href="https://oza-app-stable.vercel.app/sportif/checkin">Renseigner mon check-in</a></p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend a répondu ${res.status}: ${body}`);
  }
}

export default async function handler(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  try {
    getAdminApp();
    const db = getFirestore();
    const date = todayKey();

    const sportifsSnap = await db.collection("users").where("role", "==", "sportif").get();

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const userDoc of sportifsSnap.docs) {
      const data = userDoc.data();
      const email = data.email as string | undefined;
      if (!email) {
        skipped++;
        continue;
      }

      const wellnessDoc = await db.collection("wellness").doc(`${userDoc.id}_${date}`).get();
      if (wellnessDoc.exists) {
        skipped++;
        continue;
      }

      try {
        await sendReminderEmail(email, data.firstName ?? "");
        sent++;
      } catch (err) {
        errors.push(`${email}: ${(err as Error).message}`);
      }
    }

    res.status(200).json({ date, sent, skipped, errors });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
