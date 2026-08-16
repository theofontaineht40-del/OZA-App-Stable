import * as Print from "expo-print";
import { Platform } from "react-native";

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

function exerciceRowHtml(exercice: BlocExercice): string {
  const charge = exercice.chargeValeur
    ? `${escapeHtml(exercice.chargeValeur)} ${CHARGE_LABELS[exercice.chargeType]}`
    : "—";
  const repos = [exercice.reposSeries, exercice.reposRepetitions]
    .filter(Boolean)
    .join(" / ") || "—";

  return `
    <tr>
      <td class="ex-nom">${escapeHtml(exercice.exerciceNom)}</td>
      <td>${escapeHtml(exercice.series) || "—"} × ${escapeHtml(exercice.repetitions) || "—"}</td>
      <td>${escapeHtml(exercice.tempo) || "—"}</td>
      <td>${charge}${exercice.poidsIndicatif ? ` (${escapeHtml(exercice.poidsIndicatif)} kg)` : ""}</td>
      <td>${repos}</td>
    </tr>
    ${exercice.commentaires ? `<tr class="ex-comment-row"><td colspan="5">${escapeHtml(exercice.commentaires)}</td></tr>` : ""}
  `;
}

function blocHtml(bloc: Bloc): string {
  if (bloc.exercices.length === 0) return "";
  return `
    <div class="bloc" style="border-left-color: ${bloc.couleur}">
      <h3>${escapeHtml(bloc.nom)}${bloc.objectif ? ` <span class="objectif">— ${escapeHtml(bloc.objectif)}</span>` : ""}</h3>
      <table>
        <thead>
          <tr>
            <th>Exercice</th>
            <th>Séries × reps</th>
            <th>Tempo</th>
            <th>Charge</th>
            <th>Repos</th>
          </tr>
        </thead>
        <tbody>
          ${bloc.exercices.map(exerciceRowHtml).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function seanceHtml(seance: Seance): string {
  const blocsHtml = seance.blocs.map(blocHtml).join("");
  if (!blocsHtml.trim()) return "";
  return `
    <section class="seance">
      <h2>${escapeHtml(seance.nom)}</h2>
      ${blocsHtml}
    </section>
  `;
}

export function buildProgrammePdfHtml(programme: Programme): string {
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
          .meta { text-align: right; font-size: 12px; color: #666666; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          .subtitle { font-size: 13px; color: #666666; margin: 0 0 24px; }
          h2 {
            font-size: 15px;
            background: #FF2D7A;
            color: #FFFFFF;
            padding: 8px 12px;
            border-radius: 8px;
            margin: 24px 0 12px;
          }
          .seance:first-of-type h2 { margin-top: 0; }
          .bloc {
            border-left: 4px solid #FF2D7A;
            padding-left: 12px;
            margin-bottom: 18px;
          }
          .bloc h3 { font-size: 13px; margin: 0 0 8px; }
          .objectif { font-weight: 400; color: #666666; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th {
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #888888;
            border-bottom: 1px solid #E0E0E0;
            padding: 6px 8px;
          }
          td { padding: 6px 8px; border-bottom: 1px solid #F0F0F0; }
          .ex-nom { font-weight: 600; }
          .ex-comment-row td {
            font-style: italic;
            color: #666666;
            padding-top: 0;
            border-bottom: 1px solid #F0F0F0;
          }
          .empty { color: #888888; font-size: 13px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">OZA</div>
          <div class="meta">Généré le ${dateLabel}</div>
        </div>
        <h1>${escapeHtml(programme.nom)}</h1>
        <p class="subtitle">${programme.sportifName ? `Pour ${escapeHtml(programme.sportifName)}` : "Programme non assigné"}</p>
        ${programme.seances.map(seanceHtml).join("") || `<p class="empty">Aucune séance renseignée.</p>`}
      </body>
    </html>
  `;
}

// Sur natif (iOS/Android), printToFileAsync génère un vrai fichier PDF que
// l'on partage/enregistre via le sélecteur système. Sur web, expo-print
// délègue à Print.printAsync du navigateur, qui imprime la page courante
// entière plutôt que le HTML fourni — inutilisable ici. On ouvre donc
// nous-mêmes une fenêtre isolée ne contenant que le programme, sur laquelle
// on déclenche window.print() : le coach choisit "Enregistrer en PDF" depuis
// cette boîte, ce qui reste le geste standard pour "télécharger" sur le web.
export async function downloadProgrammePdf(programme: Programme): Promise<void> {
  const html = buildProgrammePdfHtml(programme);

  if (Platform.OS === "web") {
    const printWindow = window.open("", "_blank");
    if (!printWindow) throw new Error("popup blocked");
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
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
