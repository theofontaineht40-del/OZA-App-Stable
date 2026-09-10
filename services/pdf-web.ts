// Plomberie commune de génération PDF côté web, partagée par programme-pdf.ts
// et report-pdf.ts : rendu d'un HTML hors-écran → rasterisation html2canvas →
// découpe en pages A4 → assemblage jsPDF → téléchargement (ou ouverture dans
// l'onglet pré-ouvert sur iOS). Sur natif, chaque appelant utilise
// directement expo-print, qui n'a besoin d'aucune de ces fonctions.

import { Platform } from "react-native";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sanitizeFileName(name: string, fallback = "document"): string {
  return name.replace(/[^\p{L}\p{N}\- _]/gu, "").trim() || fallback;
}

// html2canvas rasterise en lisant les pixels des <img> du DOM : une image
// chargée depuis un domaine différent (Firebase Storage) « tache » le canvas
// résultant quand la réponse CORS n'est pas exploitable, et
// canvas.toDataURL() produit alors une image invalide — jsPDF échoue avec
// "wrong PNG signature", une erreur qui ne dit rien de la vraie cause. On
// contourne le problème en amont : chaque image est retéléchargée puis
// convertie en data URI (aucune origine, donc jamais de canvas taché) avant
// de construire le HTML — web uniquement, expo-print sur natif n'a pas ce
// problème.
export async function toDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    // Une image qui échoue à charger ne doit pas bloquer tout le PDF —
    // l'appelant affiche déjà un état neutre pour null.
    return null;
  }
}

export async function toDataUriMap(
  map: Map<string, string | null>
): Promise<Map<string, string | null>> {
  const entries = await Promise.all(
    Array.from(map.entries()).map(
      async ([id, url]) => [id, url ? await toDataUri(url) : null] as const
    )
  );
  return new Map(entries);
}

// Safari iOS (et surtout la PWA "standalone" ajoutée à l'écran d'accueil)
// ignore ou bloque en silence le téléchargement direct (clic simulé sur un
// <a download> pointant vers un blob) : le bouton ne fait rien, sans erreur.
// L'appelant ouvre alors un onglet vide DANS le geste utilisateur synchrone
// (avant tout await), et on le pointe vers le blob PDF une fois prêt.
export function isIOSWeb(): boolean {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ s'annonce comme "MacIntel" en desktop mode ; le tactile le
    // trahit (un vrai Mac n'a pas de maxTouchPoints > 1).
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export type Range = { top: number; bottom: number };

export type RenderedDoc = {
  canvas: HTMLCanvasElement;
  // Rectangles (en px canvas) des éléments à ne jamais couper entre deux
  // pages (blocs d'exercices, cartes de synthèse, graphiques...).
  noSplitRanges: Range[];
};

const CANVAS_SCALE = 2;

// Rend le HTML dans un iframe hors-écran (même document, donc html2canvas
// peut lire les styles calculés), le temps de le rasteriser en image.
// `noSplitSelector` : sélecteur CSS des éléments à garder d'un seul tenant.
export async function renderHtmlToCanvas(
  html: string,
  noSplitSelector = ".bloc"
): Promise<RenderedDoc> {
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

    // iframe.onload ne garantit pas que les <img> ont fini de charger —
    // mesurer scrollHeight trop tôt tronque tout ce qui suit dans le document.
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

    // Safari plafonne l'aire d'un canvas (~16 Mpx) : au-delà, toDataURL()
    // renvoie "data:," et jsPDF échoue en "wrong PNG signature". Un rapport
    // long (grand historique, longue liste de séances) atteint vite ce seuil
    // à l'échelle x2 — on réduit alors l'échelle juste ce qu'il faut pour
    // repasser sous une marge sûre, quitte à un rendu un peu moins net.
    const MAX_CANVAS_AREA = 12_000_000;
    const naturalArea = 794 * contentHeight * CANVAS_SCALE * CANVAS_SCALE;
    const scale =
      naturalArea > MAX_CANVAS_AREA
        ? Math.max(1, CANVAS_SCALE * Math.sqrt(MAX_CANVAS_AREA / naturalArea))
        : CANVAS_SCALE;

    // Mesuré avant rasterisation, pendant que les éléments sont encore
    // adressables dans le DOM — après html2canvas on n'a plus qu'une image.
    const noSplitRanges: Range[] = Array.from(
      frameDoc.querySelectorAll<HTMLElement>(noSplitSelector)
    ).map((el) => ({
      top: el.getBoundingClientRect().top * scale,
      bottom: el.getBoundingClientRect().bottom * scale,
    }));

    const canvas = await html2canvas(frameDoc.body, {
      useCORS: true,
      scale,
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

// Si la limite naturelle de page tombe au milieu d'un élément "insécable",
// on recule la coupure à son début (quitte à laisser du blanc en bas de
// page). Un élément plus grand qu'une pleine page est coupé brut.
function findPageBreak(
  naiveEnd: number,
  cursor: number,
  canvasHeight: number,
  ranges: Range[]
): number {
  if (naiveEnd >= canvasHeight) return canvasHeight;
  const straddling = ranges.find((r) => r.top < naiveEnd && r.bottom > naiveEnd);
  if (straddling && straddling.top > cursor) return straddling.top;
  return naiveEnd;
}

// Découpe la longue image rendue en pages A4 successives, en évitant de
// couper un élément insécable en deux, pour produire un vrai PDF
// téléchargeable en un clic (pas de boîte d'impression).
export async function canvasToPdfDownload(
  { canvas, noSplitRanges }: RenderedDoc,
  fileName: string,
  preOpenedWindow: Window | null = null
): Promise<void> {
  // Import direct du build ESM navigateur : le "main" du package pointe vers
  // le build Node (require() dynamique que Metro ne sait pas transformer).
  const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
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
    const sliceData = sliceCanvas.toDataURL("image/png");
    // Un canvas trop grand (limite Safari) fait renvoyer "data:," ici :
    // jsPDF échouerait ensuite en "wrong PNG signature", message opaque.
    if (!sliceData.startsWith("data:image/png")) {
      throw new Error("Le document est trop volumineux pour être généré (essayez une période plus courte).");
    }
    pdf.addImage(sliceData, "PNG", 0, 0, pageWidth, imgHeight);

    cursor = end;
    firstPage = false;
  }

  // Sur iOS, on pointe l'onglet ouvert en amont vers le blob : Safari
  // l'affiche dans son lecteur PDF natif, avec un bouton "Partager" qui
  // propose "Enregistrer dans Fichiers".
  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = String(pdf.output("bloburl"));
    return;
  }

  pdf.save(`${fileName}.pdf`);
}
