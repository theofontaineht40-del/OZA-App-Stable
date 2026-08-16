import * as Print from "expo-print";
import { Platform } from "react-native";

import { getCoachProfile } from "./discovery";
import { getExerciseLibrary } from "./exercises";
import { Bloc, BlocExercice, ChargeType, Programme, Seance } from "./programmes";

const CHARGE_LABELS: Record<ChargeType, string> = {
  "1rm": "% 1RM",
  rpe: "RPE",
  libre: "kg",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
            color: #111111;
            padding: 32px;
            margin: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 3px solid #FF2D7A;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .logo { font-size: 22px; font-weight: 800; color: #FF2D7A; letter-spacing: 1px; }
          .meta { text-align: right; font-size: 12px; color: #666666; line-height: 1.5; }
          .meta strong { color: #111111; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          .subtitle { font-size: 13px; color: #666666; margin: 0 0 24px; }
          h2 {
            font-size: 15px;
            background: #FF2D7A;
            color: #FFFFFF;
            padding: 8px 12px;
            border-radius: 8px;
            margin: 24px 0 12px;
            break-after: avoid;
          }
          .seance { break-inside: avoid-page; }
          .seance:first-of-type h2 { margin-top: 0; }
          .bloc {
            border-left: 4px solid #FF2D7A;
            padding-left: 12px;
            margin-bottom: 18px;
            break-inside: avoid-page;
          }
          .bloc h3 { font-size: 13px; margin: 0 0 8px; }
          .objectif { font-weight: 400; color: #666666; }

          table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 10.5px; }
          col.col-exercice { width: 34%; }
          col.col-stat { width: 11%; }
          th, td { padding: 6px 6px; border-bottom: 1px solid #F0F0F0; text-align: center; }
          th.col-exercice, td.col-exercice { text-align: left; }
          th {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #888888;
            border-bottom: 1px solid #E0E0E0;
            font-weight: 600;
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
          <div class="logo">OZA</div>
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

function sanitizeFileName(name: string): string {
  return name.replace(/[^\p{L}\p{N}\- _]/gu, "").trim() || "programme";
}

// Rend le HTML dans un iframe hors-écran (même document, donc html2canvas
// peut lire les styles calculés), le temps de le rasteriser en image.
async function renderHtmlToCanvas(html: string): Promise<HTMLCanvasElement> {
  const html2canvas = (await import("html2canvas")).default;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = "794px"; // ~A4 à 96dpi
  iframe.style.height = "1123px";
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error("iframe load failed"));
      iframe.srcdoc = html;
    });

    const frameDoc = iframe.contentDocument;
    if (!frameDoc) throw new Error("no iframe document");

    // iframe.onload ne garantit pas que les <img> (chargées depuis jsDelivr)
    // ont fini de charger — mesurer scrollHeight trop tôt tronque tout ce
    // qui suit dans le document (ex: la séance 2 coupée dans le PDF).
    const images = Array.from(frameDoc.images);
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve());
              img.addEventListener("error", () => resolve());
            })
      )
    );

    const contentHeight = frameDoc.documentElement.scrollHeight;
    iframe.style.height = `${contentHeight}px`;

    return await html2canvas(frameDoc.body, {
      useCORS: true,
      width: 794,
      windowWidth: 794,
      height: contentHeight,
      windowHeight: contentHeight,
    });
  } finally {
    document.body.removeChild(iframe);
  }
}

// Découpe la longue image rendue en pages A4 successives pour produire un
// vrai PDF téléchargeable en un clic (pas de boîte d'impression) — jsPDF
// gère lui-même le déclenchement du download via pdf.save().
async function canvasToPdfDownload(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
  // Import direct du build ESM navigateur : le "main" du package pointe vers
  // le build Node (require() dynamique que Metro ne sait pas transformer),
  // Metro n'applique pas le champ "browser" comme le ferait Webpack.
  const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${fileName}.pdf`);
}

// Sur natif (iOS/Android), printToFileAsync génère un vrai fichier PDF que
// l'on partage/enregistre via le sélecteur système. Sur web, expo-print ne
// permet pas de générer un fichier (il délègue à l'impression navigateur) —
// on rend donc le programme dans un iframe hors-écran, on le rasterise avec
// html2canvas, puis jsPDF assemble les pages et déclenche un vrai
// téléchargement de fichier .pdf, sans boîte de dialogue d'impression.
export async function downloadProgrammePdf(programme: Programme): Promise<void> {
  const [photosByExerciceId, coachProfile] = await Promise.all([
    buildPhotoMap(programme.coachId),
    getCoachProfile(programme.coachId),
  ]);
  const coachInfo: PdfCoachInfo | null = coachProfile
    ? { nom: `${coachProfile.firstName} ${coachProfile.lastName}`.trim(), entreprise: coachProfile.entreprise }
    : null;
  const html = buildProgrammePdfHtml(programme, photosByExerciceId, coachInfo);

  if (Platform.OS === "web") {
    const canvas = await renderHtmlToCanvas(html);
    await canvasToPdfDownload(canvas, sanitizeFileName(programme.nom));
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const Sharing = await import("expo-sharing");
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: programme.nom,
      UTI: "com.adobe.pdf",
    });
  }
}
