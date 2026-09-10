import * as Print from "expo-print";
import { Platform } from "react-native";

import { getCoachProfile } from "./discovery";
import { getExerciseLibrary } from "./exercises";
import {
  canvasToPdfDownload,
  escapeHtml,
  isIOSWeb,
  renderHtmlToCanvas,
  sanitizeFileName,
  toDataUri,
  toDataUriMap,
} from "./pdf-web";
import { Bloc, BlocExercice, ChargeType, Programme, Seance } from "./programmes";

const CHARGE_LABELS: Record<ChargeType, string> = {
  "1rm": "% 1RM",
  rpe: "RPE",
  libre: "kg",
};

function exerciceRowHtml(exercice: BlocExercice, photoUrl: string | null | undefined): string {
  const charge = exercice.chargeValeur
    ? `${escapeHtml(exercice.chargeValeur)} ${CHARGE_LABELS[exercice.chargeType]}`
    : "—";
  const repos = [exercice.reposSeries, exercice.reposRepetitions]
    .filter(Boolean)
    .join(" / ") || "—";
  const thumb = photoUrl
    ? `<img class="ex-thumb" src="${escapeHtml(photoUrl)}" />`
    : `<div class="ex-thumb ex-thumb-empty"></div>`;

  return `
    <tr>
      <td class="col-exercice">
        <div class="ex-cell">
          ${thumb}
          <span class="ex-nom">${escapeHtml(exercice.exerciceNom)}</span>
        </div>
      </td>
      <td class="col-stat">${escapeHtml(exercice.series) || "—"}</td>
      <td class="col-stat">${escapeHtml(exercice.repetitions) || "—"}</td>
      <td class="col-stat">${escapeHtml(exercice.tempo) || "—"}</td>
      <td class="col-stat">${charge}</td>
      <td class="col-stat">${exercice.poidsIndicatif ? `${escapeHtml(exercice.poidsIndicatif)} kg` : "—"}</td>
      <td class="col-stat">${repos}</td>
    </tr>
    ${exercice.commentaires ? `<tr class="ex-comment-row"><td colspan="7">${escapeHtml(exercice.commentaires)}</td></tr>` : ""}
  `;
}

function blocHtml(bloc: Bloc, photosByExerciceId: Map<string, string | null>): string {
  if (bloc.exercices.length === 0) return "";
  return `
    <div class="bloc" style="border-left-color: ${bloc.couleur}">
      <h3>${escapeHtml(bloc.nom)}${bloc.objectif ? ` <span class="objectif">— ${escapeHtml(bloc.objectif)}</span>` : ""}</h3>
      <table>
        <colgroup>
          <col class="col-exercice" />
          <col class="col-stat" />
          <col class="col-stat" />
          <col class="col-stat" />
          <col class="col-stat" />
          <col class="col-stat" />
          <col class="col-stat" />
        </colgroup>
        <thead>
          <tr>
            <th class="col-exercice">Exercice</th>
            <th class="col-stat">Séries</th>
            <th class="col-stat">Reps</th>
            <th class="col-stat">Tempo</th>
            <th class="col-stat">Charge</th>
            <th class="col-stat">Poids</th>
            <th class="col-stat">Repos</th>
          </tr>
        </thead>
        <tbody>
          ${bloc.exercices.map((e) => exerciceRowHtml(e, photosByExerciceId.get(e.exerciceId))).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function seanceHtml(seance: Seance, photosByExerciceId: Map<string, string | null>): string {
  const blocsHtml = seance.blocs.map((b) => blocHtml(b, photosByExerciceId)).join("");
  if (!blocsHtml.trim()) return "";
  return `
    <section class="seance">
      <h2>${escapeHtml(seance.nom)}</h2>
      ${blocsHtml}
    </section>
  `;
}

export type PdfCoachInfo = {
  nom: string;
  entreprise: string;
  // Logo de salle optionnel (services/discovery.ts, réglé depuis Profil
  // professionnel) — remplace la décoration par défaut du header quand il
  // est renseigné.
  logoUrl: string | null;
};

export function buildProgrammePdfHtml(
  programme: Programme,
  photosByExerciceId: Map<string, string | null> = new Map(),
  coachInfo: PdfCoachInfo | null = null
): string {
  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, Helvetica, Arial, sans-serif;
            color: #101C1B;
            padding: 32px;
            margin: 0;
          }
          .header {
            position: relative;
            overflow: hidden;
            border-radius: 20px;
            background:
              radial-gradient(circle at 0% 0%, #0B2E2D 0%, #14B8A6 32%, rgba(20,184,166,0.18) 55%, #F6F4EE 78%);
            padding: 24px 28px;
            margin-bottom: 28px;
            min-height: 92px;
          }
          .header-dots {
            position: absolute;
            top: 18px;
            left: 22px;
            width: 64px;
            height: 64px;
            background-image: radial-gradient(rgba(255,255,255,0.6) 1.4px, transparent 1.4px);
            background-size: 11px 11px;
          }
          .header-lines { position: absolute; top: -10px; right: -10px; }
          .header-logo {
            position: absolute;
            top: 18px;
            left: 22px;
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: #FFFFFF;
            padding: 6px;
          }
          .header-logo img { width: 100%; height: 100%; object-fit: contain; }
          .meta { position: relative; text-align: right; font-size: 12px; color: #0B2E2D; line-height: 1.6; }
          .meta strong { color: #0B2E2D; font-size: 14px; }
          h1 { font-size: 22px; margin: 0 0 4px; color: #101C1B; }
          .subtitle { font-size: 13px; color: #667771; margin: 0 0 24px; }
          h2 {
            font-size: 15px;
            background: #14B8A6;
            color: #FFFFFF;
            padding: 10px 14px;
            border-radius: 10px;
            margin: 24px 0 14px;
            break-after: avoid;
          }
          .seance { break-inside: avoid-page; }
          .seance:first-of-type h2 { margin-top: 0; }
          .bloc {
            background: #FFFFFF;
            border: 1px solid #E4EFEC;
            border-left: 4px solid #14B8A6;
            border-radius: 14px;
            padding: 14px 16px;
            margin-bottom: 16px;
            break-inside: avoid-page;
          }
          .bloc h3 { font-size: 13px; margin: 0 0 8px; }
          .objectif { font-weight: 400; color: #667771; }

          table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 10.5px; }
          col.col-exercice { width: 34%; }
          col.col-stat { width: 11%; }
          th, td { padding: 6px 4px; border-bottom: 1px solid #F0F0F0; text-align: center; }
          th.col-exercice, td.col-exercice { text-align: left; }
          th {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            color: #888888;
            border-bottom: 1px solid #E0E0E0;
            font-weight: 600;
            overflow: hidden;
            white-space: nowrap;
          }
          td.col-stat { font-variant-numeric: tabular-nums; white-space: nowrap; }

          .ex-cell { display: flex; align-items: center; gap: 8px; }
          .ex-thumb {
            width: 34px;
            height: 34px;
            border-radius: 6px;
            object-fit: cover;
            flex-shrink: 0;
            background: #F2F2F2;
          }
          .ex-thumb-empty { border: 1px solid #E0E0E0; }
          .ex-nom { font-weight: 600; }

          .ex-comment-row td {
            font-style: italic;
            color: #666666;
            text-align: left;
            padding-top: 0;
            border-bottom: 1px solid #F0F0F0;
          }
          .empty { color: #888888; font-size: 13px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${
            coachInfo?.logoUrl
              ? `<div class="header-logo"><img src="${escapeHtml(coachInfo.logoUrl)}" /></div>`
              : `<div class="header-dots"></div>
          <svg class="header-lines" width="220" height="150" viewBox="0 0 220 150">
            <line x1="120" y1="-10" x2="240" y2="110" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1" />
            <line x1="150" y1="-10" x2="270" y2="110" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1" />
            <line x1="180" y1="-10" x2="300" y2="110" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1" />
            <circle cx="170" cy="55" r="55" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="1" fill="none" />
          </svg>`
          }
          <div class="meta">
            ${coachInfo?.nom ? `<div><strong>${escapeHtml(coachInfo.nom)}</strong></div>` : ""}
            ${coachInfo?.entreprise ? `<div>${escapeHtml(coachInfo.entreprise)}</div>` : ""}
            <div>Généré le ${dateLabel}</div>
          </div>
        </div>
        <h1>${escapeHtml(programme.nom)}</h1>
        <p class="subtitle">${programme.sportifName ? `Pour ${escapeHtml(programme.sportifName)}` : "Programme non assigné"}</p>
        ${programme.seances.map((s) => seanceHtml(s, photosByExerciceId)).join("") || `<p class="empty">Aucune séance renseignée.</p>`}
      </body>
    </html>
  `;
}

async function buildPhotoMap(coachId: string): Promise<Map<string, string | null>> {
  const library = await getExerciseLibrary(coachId);
  return new Map(library.map((e) => [e.id, e.photoUrl ?? null]));
}

// Sur natif (iOS/Android), printToFileAsync génère un vrai fichier PDF que
// l'on partage/enregistre via le sélecteur système. Sur web, expo-print ne
// permet pas de générer un fichier (il délègue à l'impression navigateur) —
// on rend donc le programme dans un iframe hors-écran, on le rasterise avec
// html2canvas, puis jsPDF assemble les pages et déclenche un vrai
// téléchargement de fichier .pdf, sans boîte de dialogue d'impression.
export async function downloadProgrammePdf(programme: Programme): Promise<void> {
  // Doit s'exécuter avant le premier `await` : c'est ce qui garde cet appel
  // dans le geste utilisateur synchrone du clic. Une fois qu'on a `await`é
  // quoi que ce soit, Safari ne considère plus un `window.open()` ultérieur
  // comme fiable et le bloque en pop-up.
  const preOpenedWindow = isIOSWeb() ? window.open("", "_blank") : null;

  try {
    const [photosByExerciceId, coachProfile] = await Promise.all([
      buildPhotoMap(programme.coachId),
      getCoachProfile(programme.coachId),
    ]);
    const coachInfo: PdfCoachInfo | null = coachProfile
      ? {
          nom: `${coachProfile.firstName} ${coachProfile.lastName}`.trim(),
          entreprise: coachProfile.entreprise,
          logoUrl: coachProfile.structureLogoUrl,
        }
      : null;

    if (Platform.OS === "web") {
      const [webPhotos, webLogoUrl] = await Promise.all([
        toDataUriMap(photosByExerciceId),
        coachInfo?.logoUrl ? toDataUri(coachInfo.logoUrl) : Promise.resolve<string | null>(null),
      ]);
      const webCoachInfo = coachInfo ? { ...coachInfo, logoUrl: webLogoUrl } : null;
      const html = buildProgrammePdfHtml(programme, webPhotos, webCoachInfo);
      const rendered = await renderHtmlToCanvas(html);
      await canvasToPdfDownload(rendered, sanitizeFileName(programme.nom, "programme"), preOpenedWindow);
      return;
    }

    const html = buildProgrammePdfHtml(programme, photosByExerciceId, coachInfo);
    const { uri } = await Print.printToFileAsync({ html });
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: programme.nom,
        UTI: "com.adobe.pdf",
      });
    }
  } catch (error) {
    // Referme l'onglet vide plutôt que de le laisser planté si la
    // génération échoue avant d'avoir pu le pointer vers le PDF.
    preOpenedWindow?.close();
    throw error;
  }
}
