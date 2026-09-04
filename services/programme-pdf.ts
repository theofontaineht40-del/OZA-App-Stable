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

function sanitizeFileName(name: string): string {
  return name.replace(/[^\p{L}\p{N}\- _]/gu, "").trim() || "programme";
}

// Safari iOS (et surtout la PWA "standalone" ajoutée à l'écran d'accueil)
// ignore ou bloque en silence le téléchargement direct qu'utilise
// canvasToPdfDownload ailleurs (clic simulé sur un <a download> pointant
// vers un blob) : le bouton ne fait rien, sans erreur — voir
// downloadProgrammePdf ci-dessous pour le contournement.
function isIOSWeb(): boolean {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ s'annonce comme "MacIntel" en desktop mode ; le tactile le
    // trahit (un vrai Mac n'a pas de maxTouchPoints > 1).
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

type Range = { top: number; bottom: number };

type RenderedProgramme = {
  canvas: HTMLCanvasElement;
  // Rectangles (en px canvas) des blocs — ne jamais couper une page à
  // l'intérieur d'un de ces intervalles, pour ne pas trancher un bloc
  // d'exercices en deux entre la fin d'une page et le début de la suivante.
  noSplitRanges: Range[];
};

const CANVAS_SCALE = 2;

// Rend le HTML dans un iframe hors-écran (même document, donc html2canvas
// peut lire les styles calculés), le temps de le rasteriser en image.
async function renderHtmlToCanvas(html: string): Promise<RenderedProgramme> {
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

    // Mesurée avant rasterisation, pendant que .bloc est encore un élément
    // DOM adressable — après html2canvas on n'a plus qu'une image plate.
    const noSplitRanges: Range[] = Array.from(frameDoc.querySelectorAll<HTMLElement>(".bloc")).map(
      (el) => ({
        top: el.getBoundingClientRect().top * CANVAS_SCALE,
        bottom: el.getBoundingClientRect().bottom * CANVAS_SCALE,
      })
    );

    const canvas = await html2canvas(frameDoc.body, {
      useCORS: true,
      scale: CANVAS_SCALE,
      width: 794,
      windowWidth: 794,
      height: contentHeight,
      windowHeight: contentHeight,
    });

    return { canvas, noSplitRanges };
  } finally {
    document.body.removeChild(iframe);
  }
}

// Un bloc d'exercices ne doit jamais être coupé entre deux pages : si la
// limite naturelle de page tombe au milieu d'un bloc, on recule la coupure
// au début de ce bloc (quitte à laisser un peu de blanc en bas de page).
// Si le bloc lui-même dépasse une pleine page, on ne peut rien faire de
// mieux qu'une coupure brute — le cas ne se présente pas en pratique ici.
function findPageBreak(naiveEnd: number, cursor: number, canvasHeight: number, ranges: Range[]): number {
  if (naiveEnd >= canvasHeight) return canvasHeight;
  const straddling = ranges.find((r) => r.top < naiveEnd && r.bottom > naiveEnd);
  if (straddling && straddling.top > cursor) return straddling.top;
  return naiveEnd;
}

// Découpe la longue image rendue en pages A4 successives, en évitant de
// couper un bloc en deux, pour produire un vrai PDF téléchargeable en un
// clic (pas de boîte d'impression) — jsPDF gère lui-même le déclenchement
// du download via pdf.save().
async function canvasToPdfDownload(
  { canvas, noSplitRanges }: RenderedProgramme,
  fileName: string,
  preOpenedWindow: Window | null = null
): Promise<void> {
  // Import direct du build ESM navigateur : le "main" du package pointe vers
  // le build Node (require() dynamique que Metro ne sait pas transformer),
  // Metro n'applique pas le champ "browser" comme le ferait Webpack.
  const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  // Hauteur d'une page A4, convertie en px canvas à la même échelle que
  // l'image (largeur de page = largeur du canvas).
  const pageHeightPx = (pageHeight * canvas.width) / pageWidth;

  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  const sliceCtx = sliceCanvas.getContext("2d");
  if (!sliceCtx) throw new Error("no 2d context");

  let cursor = 0;
  let firstPage = true;
  while (cursor < canvas.height) {
    const naiveEnd = Math.min(cursor + pageHeightPx, canvas.height);
    const end = findPageBreak(naiveEnd, cursor, canvas.height, noSplitRanges);
    const sliceHeight = end - cursor;

    sliceCanvas.height = sliceHeight;
    sliceCtx.clearRect(0, 0, sliceCanvas.width, sliceHeight);
    sliceCtx.drawImage(canvas, 0, cursor, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    if (!firstPage) pdf.addPage();
    const imgHeight = (sliceHeight * pageWidth) / canvas.width;
    pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, imgHeight);

    cursor = end;
    firstPage = false;
  }

  // Sur iOS, le clic simulé sur <a download> (ce que fait pdf.save() en
  // interne) est ignoré par Safari — on pointe à la place l'onglet ouvert
  // en amont (encore dans le geste utilisateur, voir isIOSWeb) vers le
  // blob : Safari l'affiche dans son lecteur PDF natif, avec un bouton
  // "Partager" qui propose "Enregistrer dans Fichiers".
  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = String(pdf.output("bloburl"));
    return;
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
    const html = buildProgrammePdfHtml(programme, photosByExerciceId, coachInfo);

    if (Platform.OS === "web") {
      const rendered = await renderHtmlToCanvas(html);
      await canvasToPdfDownload(rendered, sanitizeFileName(programme.nom), preOpenedWindow);
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
  } catch (error) {
    // Referme l'onglet vide plutôt que de le laisser planté si la
    // génération échoue avant d'avoir pu le pointer vers le PDF.
    preOpenedWindow?.close();
    throw error;
  }
}
