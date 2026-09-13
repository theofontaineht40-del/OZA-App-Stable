// Plomberie commune de génération PDF côté web, partagée par programme-pdf.ts
// et report-pdf.ts : rendu d'un HTML hors-écran → rasterisation html2canvas
// PAGE PAR PAGE → assemblage jsPDF → téléchargement (ou ouverture dans
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

type Range = { top: number; bottom: number };

const CANVAS_SCALE = 2;
// Hauteur d'une page A4 à 96dpi, en px de CONTENU (avant mise à l'échelle
// canvas) — c'est la même unité que scrollHeight/getBoundingClientRect.
const PAGE_HEIGHT_PX = 1123;

// Si la limite naturelle de page tombe au milieu d'un élément "insécable",
// on recule la coupure à son début (quitte à laisser du blanc en bas de
// page). Un élément plus grand qu'une pleine page est coupé brut.
function findPageBreak(
  naiveEnd: number,
  cursor: number,
  contentHeight: number,
  ranges: Range[]
): number {
  if (naiveEnd >= contentHeight) return contentHeight;
  const straddling = ranges.find((r) => r.top < naiveEnd && r.bottom > naiveEnd);
  if (straddling && straddling.top > cursor) return straddling.top;
  return naiveEnd;
}

// Rend le HTML dans un iframe hors-écran (même document, donc html2canvas
// peut lire les styles calculés) et rasterise CHAQUE page séparément — un
// canvas par page plutôt qu'un unique immense canvas redécoupé après coup.
// Un document long (grand historique, nombreuses séances/photos) ne crée
// donc jamais un canvas dépassant la limite de taille de Safari (~16 Mpx),
// quelle que soit sa longueur totale : chaque page reste bornée à ~A4.
// `noSplitSelector` : sélecteur CSS des éléments à garder d'un seul tenant.
export async function renderHtmlToPages(
  html: string,
  noSplitSelector = ".bloc"
): Promise<HTMLCanvasElement[]> {
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

    // Mesuré avant rasterisation, pendant que les éléments sont encore
    // adressables dans le DOM — en px de contenu, mêmes unités que le
    // découpage en pages ci-dessous (pas de mise à l'échelle canvas ici).
    const noSplitRanges: Range[] = Array.from(
      frameDoc.querySelectorAll<HTMLElement>(noSplitSelector)
    ).map((el) => ({
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
    }));

    const pages: HTMLCanvasElement[] = [];
    let cursor = 0;
    while (cursor < contentHeight) {
      const naiveEnd = Math.min(cursor + PAGE_HEIGHT_PX, contentHeight);
      const end = findPageBreak(naiveEnd, cursor, contentHeight, noSplitRanges);

      // x/y/width/height cadrent la zone rasterisée dans le canvas de
      // sortie ; windowWidth/windowHeight fixent le viewport virtuel utilisé
      // pour la mise en page (le document entier, pour un layout identique
      // quelle que soit la page en cours de rendu).
      const canvas = await html2canvas(frameDoc.body, {
        useCORS: true,
        scale: CANVAS_SCALE,
        x: 0,
        y: cursor,
        width: 794,
        height: end - cursor,
        windowWidth: 794,
        windowHeight: contentHeight,
      });
      pages.push(canvas);
      cursor = end;
    }

    return pages;
  } finally {
    document.body.removeChild(iframe);
  }
}

// Assemble les pages déjà rasterisées (voir renderHtmlToPages) en un PDF et
// déclenche le téléchargement — pas de boîte de dialogue d'impression.
export async function pagesToPdfDownload(
  pages: HTMLCanvasElement[],
  fileName: string,
  preOpenedWindow: Window | null = null
): Promise<void> {
  // Import direct du build ESM navigateur : le "main" du package pointe vers
  // le build Node (require() dynamique que Metro ne sait pas transformer).
  const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pages.forEach((canvas, i) => {
    if (i > 0) pdf.addPage();
    const dataUrl = canvas.toDataURL("image/png");
    // Ne devrait plus arriver (chaque page est bornée à ~A4), mais un canvas
    // qui échoue quand même à s'encoder ferait sinon échouer jsPDF plus loin
    // avec un message opaque ("wrong PNG signature").
    if (!dataUrl.startsWith("data:image/png")) {
      throw new Error(`La page ${i + 1} n'a pas pu être générée.`);
    }
    // La dernière page (ou une page raccourcie pour ne pas couper un
    // élément insécable) peut être moins haute qu'une page pleine : on
    // conserve son ratio propre plutôt que de l'étirer à pageHeight.
    const imgHeight = Math.min((canvas.height * pageWidth) / canvas.width, pageHeight);
    pdf.addImage(dataUrl, "PNG", 0, 0, pageWidth, imgHeight);
  });

  // Sur iOS, on pointe l'onglet ouvert en amont vers le blob : Safari
  // l'affiche dans son lecteur PDF natif, avec un bouton "Partager" qui
  // propose "Enregistrer dans Fichiers".
  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = String(pdf.output("bloburl"));
    return;
  }

  pdf.save(`${fileName}.pdf`);
}
