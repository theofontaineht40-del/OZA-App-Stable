// Rapports PDF téléchargeables par le coach depuis la fiche d'un sportif :
//  - rapport bien-être (Hooper Index + score, sur tout l'historique) ;
//  - rapport charge d'entraînement (ACWR / Monotony / Strain + séances).
// Réutilise la plomberie web commune de pdf-web.ts (rendu → rasterisation →
// pages A4 → download) ; sur natif, expo-print génère le fichier directement.

import * as Print from "expo-print";
import { Platform } from "react-native";

import { getCoachProfile } from "./discovery";
import {
  acwrRiskLevel,
  average,
  buildDailyLoadSeries,
  computeAcuteChronicWorkloadRatio,
  computeHooperValues,
  computeMonotony,
  computeStrain,
  monotonyRiskLevel,
  sumLoads,
  todayKey,
  wellnessStatus,
} from "./load";
import {
  canvasToPdfDownload,
  escapeHtml,
  isIOSWeb,
  renderHtmlToCanvas,
  sanitizeFileName,
  toDataUri,
} from "./pdf-web";
import type { PdfCoachInfo } from "./programme-pdf";
import type { SessionRecord, WellnessEntry } from "./tracking";

// ── Helpers de formatage ──

function frDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function frDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const dayFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayFromMonday);
  return todayKey(d);
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`).getTime();
  const b = new Date(`${toIso}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

// ── Graphiques SVG inline (aucune dépendance, rasterisés tels quels) ──

const CHART_W = 700;
const CHART_H = 200;
const TEAL = "#14B8A6";
const TEAL_DARK = "#0B2E2D";
const INK = "#101C1B";
const MUTED = "#667771";

// Courbe (aire + ligne) sur une échelle Y fixe, avec repère de moyenne.
function areaChartSvg(
  values: number[],
  opts: { yMin: number; yMax: number; baseline?: number | null; unit?: string }
): string {
  if (values.length === 0) return "";
  const { yMin, yMax, baseline = null, unit = "" } = opts;
  const padL = 34;
  const padR = 12;
  const padT = 12;
  const padB = 22;
  const innerW = CHART_W - padL - padR;
  const innerH = CHART_H - padT - padB;
  const span = yMax - yMin || 1;

  const x = (i: number) =>
    padL + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - ((v - yMin) / span) * innerH;

  const linePts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const areaPts = `${padL},${padT + innerH} ${linePts} ${padL + innerW},${padT + innerH}`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const gv = yMin + f * span;
      const gy = y(gv);
      return `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${padL + innerW}" y2="${gy.toFixed(
        1
      )}" stroke="#E4EFEC" stroke-width="1" />
      <text x="${padL - 6}" y="${(gy + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="${MUTED}">${
        Math.round(gv * 10) / 10
      }</text>`;
    })
    .join("");

  const baselineLine =
    baseline != null && baseline >= yMin && baseline <= yMax
      ? `<line x1="${padL}" y1="${y(baseline).toFixed(1)}" x2="${padL + innerW}" y2="${y(
          baseline
        ).toFixed(1)}" stroke="${TEAL_DARK}" stroke-width="1" stroke-dasharray="4 3" />
         <text x="${padL + innerW}" y="${(y(baseline) - 4).toFixed(
           1
         )}" text-anchor="end" font-size="9" fill="${TEAL_DARK}">moy. ${
          Math.round(baseline * 10) / 10
        }${unit}</text>`
      : "";

  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);

  return `
  <svg width="${CHART_W}" height="${CHART_H}" viewBox="0 0 ${CHART_W} ${CHART_H}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    <polygon points="${areaPts}" fill="${TEAL}" fill-opacity="0.12" />
    <polyline points="${linePts}" fill="none" stroke="${TEAL}" stroke-width="2" stroke-linejoin="round" />
    ${baselineLine}
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.5" fill="${TEAL}" />
  </svg>`;
}

// Histogramme (charge par semaine ou par jour).
function barsChartSvg(items: { label: string; value: number }[]): string {
  if (items.length === 0) return "";
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const innerW = CHART_W - padL - padR;
  const innerH = CHART_H - padT - padB;
  const maxV = Math.max(...items.map((i) => i.value), 1);
  const slot = innerW / items.length;
  const barW = Math.min(slot * 0.68, 26);

  const gridLines = [0, 0.5, 1]
    .map((f) => {
      const gv = f * maxV;
      const gy = padT + innerH - f * innerH;
      return `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${padL + innerW}" y2="${gy.toFixed(
        1
      )}" stroke="#E4EFEC" stroke-width="1" />
      <text x="${padL - 6}" y="${(gy + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="${MUTED}">${Math.round(
        gv
      )}</text>`;
    })
    .join("");

  // N'afficher qu'une étiquette d'axe X sur k pour rester lisible.
  const labelEvery = Math.ceil(items.length / 14);

  const bars = items
    .map((it, i) => {
      const h = (it.value / maxV) * innerH;
      const bx = padL + i * slot + (slot - barW) / 2;
      const by = padT + innerH - h;
      const label =
        i % labelEvery === 0
          ? `<text x="${(bx + barW / 2).toFixed(1)}" y="${padT + innerH + 14}" text-anchor="middle" font-size="8" fill="${MUTED}">${escapeHtml(
              it.label
            )}</text>`
          : "";
      return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(
        1
      )}" height="${Math.max(h, 1).toFixed(1)}" rx="2" fill="${TEAL}" />${label}`;
    })
    .join("");

  return `
  <svg width="${CHART_W}" height="${CHART_H}" viewBox="0 0 ${CHART_W} ${CHART_H}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    ${bars}
  </svg>`;
}

// ── Gabarit HTML commun ──

function pageShell(opts: {
  coachInfo: PdfCoachInfo | null;
  title: string;
  subtitle: string;
  body: string;
}): string {
  const { coachInfo, title, subtitle, body } = opts;
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
            color: ${INK};
            padding: 32px;
            margin: 0;
          }
          .header {
            position: relative;
            overflow: hidden;
            border-radius: 20px;
            background:
              radial-gradient(circle at 0% 0%, ${TEAL_DARK} 0%, ${TEAL} 32%, rgba(20,184,166,0.18) 55%, #F6F4EE 78%);
            padding: 24px 28px;
            margin-bottom: 24px;
            min-height: 92px;
          }
          .header-dots {
            position: absolute; top: 18px; left: 22px; width: 64px; height: 64px;
            background-image: radial-gradient(rgba(255,255,255,0.6) 1.4px, transparent 1.4px);
            background-size: 11px 11px;
          }
          .header-lines { position: absolute; top: -10px; right: -10px; }
          .header-logo {
            position: absolute; top: 18px; left: 22px; width: 56px; height: 56px;
            border-radius: 12px; background: #FFFFFF; padding: 6px;
          }
          .header-logo img { width: 100%; height: 100%; object-fit: contain; }
          .meta { position: relative; text-align: right; font-size: 12px; color: ${TEAL_DARK}; line-height: 1.6; }
          .meta strong { color: ${TEAL_DARK}; font-size: 14px; }
          h1 { font-size: 22px; margin: 0 0 4px; color: ${INK}; }
          .subtitle { font-size: 13px; color: ${MUTED}; margin: 0 0 22px; }
          h2 {
            font-size: 15px; background: ${TEAL}; color: #FFFFFF;
            padding: 10px 14px; border-radius: 10px; margin: 22px 0 14px;
          }
          .no-split { break-inside: avoid-page; }
          .cards { display: flex; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
          .stat {
            flex: 1; min-width: 120px; background: #FFFFFF; border: 1px solid #E4EFEC;
            border-radius: 14px; padding: 12px 14px;
          }
          .stat .k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: ${MUTED}; }
          .stat .v { font-size: 20px; font-weight: 700; color: ${INK}; margin-top: 3px; font-variant-numeric: tabular-nums; }
          .stat .s { font-size: 10px; color: ${MUTED}; margin-top: 2px; }
          .pill { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
          .pill-green { background: #E5F5EF; color: #1B7F5B; }
          .pill-orange { background: #FCEFDD; color: #B5791C; }
          .pill-red { background: #FBE6E4; color: #C0392B; }
          .chart-card {
            background: #FFFFFF; border: 1px solid #E4EFEC; border-radius: 14px;
            padding: 14px; margin: 10px 0 18px;
          }
          .chart-card .cap { font-size: 11px; color: ${MUTED}; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          th, td { padding: 6px 8px; border-bottom: 1px solid #F0F0F0; text-align: right; }
          th:first-child, td:first-child { text-align: left; }
          th {
            font-size: 8px; text-transform: uppercase; letter-spacing: 0.2px; color: #888;
            border-bottom: 1px solid #E0E0E0; font-weight: 600; white-space: nowrap;
          }
          td { font-variant-numeric: tabular-nums; }
          .note { font-size: 10.5px; color: ${MUTED}; line-height: 1.5; margin: 8px 0 0; }
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
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        ${body}
      </body>
    </html>
  `;
}

const STATUS_PILL: Record<string, string> = {
  green: `<span class="pill pill-green">Récupération favorable</span>`,
  orange: `<span class="pill pill-orange">Récupération à surveiller</span>`,
  red: `<span class="pill pill-red">Récupération défavorable</span>`,
};

// ── Rapport bien-être ──

const VARIABLES: { key: keyof WellnessEntry & string; label: string }[] = [
  { key: "sommeil", label: "Sommeil" },
  { key: "fatigue", label: "Fatigue" },
  { key: "courbatures", label: "Courbatures" },
  { key: "stress", label: "Stress" },
];

function buildWellnessReportHtml(
  sportifName: string,
  entriesDesc: WellnessEntry[],
  coachInfo: PdfCoachInfo | null
): string {
  const asc = entriesDesc.slice().reverse();
  const latest = entriesDesc[0];
  const scores = asc.map((e) => e.score);
  const history = entriesDesc.slice(1);
  const baseline =
    history.length >= 3 ? average(history.slice(0, 28).map((e) => e.score)) : null;
  const status = wellnessStatus(latest.score, baseline);

  const avg7 = average(entriesDesc.slice(0, 7).map((e) => e.score));
  const avg28 = average(entriesDesc.slice(0, 28).map((e) => e.score));
  const avgAll = average(scores);

  const hooperLatest = computeHooperValues(latest);
  const hooperAll = average(asc.map((e) => computeHooperValues(e).hooperIndex));

  const rangeLabel =
    asc.length > 0 ? `du ${frDate(asc[0].date)} au ${frDate(asc[asc.length - 1].date)}` : "";

  const variableRows = VARIABLES.map((v) => {
    const cur = latest[v.key] as number;
    const mean = average(asc.map((e) => e[v.key] as number));
    return `<tr><td>${v.label}</td><td>${cur.toFixed(1)}</td><td>${mean.toFixed(1)}</td><td>${
      (11 - cur).toFixed(1)
    }</td></tr>`;
  }).join("");

  const historyRows = asc
    .map((e) => {
      const h = computeHooperValues(e);
      return `<tr>
        <td>${frDate(e.date)}</td>
        <td>${e.sommeil.toFixed(0)}</td>
        <td>${e.fatigue.toFixed(0)}</td>
        <td>${e.courbatures.toFixed(0)}</td>
        <td>${e.stress.toFixed(0)}</td>
        <td>${e.score.toFixed(1)}</td>
        <td>${h.hooperIndex.toFixed(0)}</td>
      </tr>`;
    })
    .join("");

  const body = `
    <div class="no-split">
      <div class="cards">
        <div class="stat">
          <div class="k">Score actuel</div>
          <div class="v">${latest.score.toFixed(1)} / 10</div>
          <div class="s">${frDate(latest.date)}</div>
        </div>
        <div class="stat">
          <div class="k">Moyennes</div>
          <div class="v">${avgAll.toFixed(1)}</div>
          <div class="s">7 j ${avg7.toFixed(1)} · 28 j ${avg28.toFixed(1)} · global ${avgAll.toFixed(1)}</div>
        </div>
        <div class="stat">
          <div class="k">Hooper Index actuel</div>
          <div class="v">${hooperLatest.hooperIndex.toFixed(0)} / 40</div>
          <div class="s">moyenne globale ${hooperAll.toFixed(0)}</div>
        </div>
      </div>
      <p class="note">Statut : ${STATUS_PILL[status]} &nbsp; — comparé à la moyenne personnelle${
        baseline != null ? ` (${baseline.toFixed(1)})` : " (historique insuffisant, seuils absolus)"
      }.</p>
    </div>

    <h2>Évolution du score bien-être</h2>
    <div class="chart-card no-split">
      <div class="cap">Score /10 par check-in — ${asc.length} points, ${rangeLabel}</div>
      ${areaChartSvg(scores, { yMin: 0, yMax: 10, baseline: avgAll })}
    </div>

    <h2>Détail par variable</h2>
    <div class="no-split">
      <table>
        <thead><tr><th>Variable</th><th>Actuel</th><th>Moy. globale</th><th>Hooper actuel</th></tr></thead>
        <tbody>${variableRows}</tbody>
      </table>
      <p class="note">Échelle affichée 1–10 « plus haut = mieux » (sommeil, fatigue, courbatures, stress).
      Colonne Hooper : valeur convertie « plus haut = état plus dégradé » (11 − valeur), somme des 4 = Hooper Index.</p>
    </div>

    <h2>Historique complet</h2>
    <table>
      <thead><tr><th>Date</th><th>Som.</th><th>Fat.</th><th>Courb.</th><th>Stress</th><th>Score</th><th>Hooper</th></tr></thead>
      <tbody>${historyRows}</tbody>
    </table>
  `;

  return pageShell({
    coachInfo,
    title: "Rapport bien-être",
    subtitle: `${sportifName} · ${asc.length} check-in${asc.length > 1 ? "s" : ""} · ${rangeLabel}`,
    body,
  });
}

// ── Rapport charge d'entraînement ──

function buildLoadReportHtml(
  sportifName: string,
  sessions: SessionRecord[],
  coachInfo: PdfCoachInfo | null
): string {
  const asc = sessions.slice().sort((a, b) => a.date.localeCompare(b.date));
  const today = todayKey();
  const firstDate = asc[0].date;
  const spanDays = Math.max(28, daysBetween(firstDate, today) + 1);

  const series = buildDailyLoadSeries(
    asc.map((s) => ({ date: s.date, load: s.load })),
    spanDays
  );
  const last28 = series.slice(-28);
  const last7 = series.slice(-7);

  const { acwr } = computeAcuteChronicWorkloadRatio(last28);
  const monotony = computeMonotony(last7);
  const strain = computeStrain(last7);
  const acwrLevel = acwrRiskLevel(acwr);
  const monoLevel = monotonyRiskLevel(monotony);

  const weeklyLoad = sumLoads(last7);
  const totalLoad = sumLoads(series);
  const weeks = series.length / 7;
  const avgWeekly = weeks > 0 ? totalLoad / weeks : 0;

  const LEVEL_PILL: Record<string, string> = {
    "sous-charge": `<span class="pill pill-orange">Sous-charge</span>`,
    optimale: `<span class="pill pill-green">Zone optimale</span>`,
    risque: `<span class="pill pill-orange">Risque</span>`,
    danger: `<span class="pill pill-red">Danger</span>`,
    low: `<span class="pill pill-green">Faible</span>`,
    medium: `<span class="pill pill-orange">Vigilance</span>`,
    high: `<span class="pill pill-red">Élevée</span>`,
  };

  // Chart : barres hebdo si la fenêtre dépasse 8 semaines, sinon barres/jour.
  let chartItems: { label: string; value: number }[];
  let chartCaption: string;
  if (series.length > 56) {
    const byWeek = new Map<string, number>();
    for (const d of series) {
      const wk = mondayOf(d.date);
      byWeek.set(wk, (byWeek.get(wk) ?? 0) + d.load);
    }
    chartItems = Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([wk, v]) => ({ label: frDateShort(wk), value: v }));
    chartCaption = `Charge hebdomadaire (UA) — ${chartItems.length} semaines, du ${frDate(
      firstDate
    )} à aujourd'hui`;
  } else {
    chartItems = series.map((d) => ({ label: frDateShort(d.date), value: d.load }));
    chartCaption = `Charge quotidienne (UA) — ${series.length} jours`;
  }

  const enoughHistory = (() => {
    const firstActive = series.findIndex((d) => d.load > 0);
    return firstActive !== -1 && series.length - firstActive >= 14;
  })();

  const sessionRows = asc
    .map(
      (s) => `<tr>
      <td>${frDate(s.date)}</td>
      <td>${escapeHtml(s.seanceNom || s.programmeNom || (s.loggedBy === "coach" ? "Séance encadrée" : "Auto-déclarée"))}</td>
      <td>${s.rpe}</td>
      <td>${s.duration}</td>
      <td>${s.load}</td>
    </tr>`
    )
    .join("");

  const indicatorsBlock = enoughHistory
    ? `<div class="cards">
        <div class="stat">
          <div class="k">ACWR (aigu / chronique)</div>
          <div class="v">${acwr.toFixed(2)}</div>
          <div class="s">${LEVEL_PILL[acwrLevel]}</div>
        </div>
        <div class="stat">
          <div class="k">Monotony (7 j)</div>
          <div class="v">${monotony.toFixed(2)}</div>
          <div class="s">${LEVEL_PILL[monoLevel]}</div>
        </div>
        <div class="stat">
          <div class="k">Strain (7 j)</div>
          <div class="v">${Math.round(strain)}</div>
          <div class="s">charge × monotony</div>
        </div>
      </div>`
    : `<p class="note">Pas encore assez d'historique de charge continu pour un ACWR fiable (14 jours de suivi minimum).</p>`;

  const body = `
    <h2>Test de charge</h2>
    <div class="no-split">
      ${indicatorsBlock}
      <div class="cards">
        <div class="stat">
          <div class="k">Charge 7 derniers jours</div>
          <div class="v">${weeklyLoad}</div>
          <div class="s">UA (RPE × durée)</div>
        </div>
        <div class="stat">
          <div class="k">Charge hebdo moyenne</div>
          <div class="v">${Math.round(avgWeekly)}</div>
          <div class="s">sur ${Math.round(weeks)} semaines</div>
        </div>
        <div class="stat">
          <div class="k">Charge cumulée totale</div>
          <div class="v">${totalLoad}</div>
          <div class="s">${asc.length} séance${asc.length > 1 ? "s" : ""}</div>
        </div>
      </div>
    </div>

    <h2>Évolution de la charge</h2>
    <div class="chart-card no-split">
      <div class="cap">${chartCaption}</div>
      ${barsChartSvg(chartItems)}
    </div>

    <h2>Séances enregistrées</h2>
    <table>
      <thead><tr><th>Date</th><th>Séance</th><th>RPE</th><th>Durée (min)</th><th>Charge (UA)</th></tr></thead>
      <tbody>${sessionRows}</tbody>
    </table>
    <p class="note">Charge d'une séance = RPE (0–10) × durée en minutes (méthode de Foster).
    ACWR = charge moyenne des 7 derniers jours / charge moyenne des 28 derniers jours.</p>
  `;

  return pageShell({
    coachInfo,
    title: "Rapport charge d'entraînement",
    subtitle: `${sportifName} · ${asc.length} séance${asc.length > 1 ? "s" : ""} · du ${frDate(
      firstDate
    )} à aujourd'hui`,
    body,
  });
}

// ── Orchestration téléchargement (même schéma que downloadProgrammePdf) ──

async function loadCoachInfo(coachId: string): Promise<PdfCoachInfo | null> {
  const profile = await getCoachProfile(coachId);
  if (!profile) return null;
  return {
    nom: `${profile.firstName} ${profile.lastName}`.trim(),
    entreprise: profile.entreprise,
    logoUrl: profile.structureLogoUrl,
  };
}

async function runDownload(
  fileBaseName: string,
  buildHtml: (coachInfo: PdfCoachInfo | null) => string,
  coachId: string,
  dialogTitle: string
): Promise<void> {
  // Avant tout await : garde l'appel dans le geste utilisateur synchrone.
  const preOpenedWindow = isIOSWeb() ? window.open("", "_blank") : null;
  try {
    const coachInfo = await loadCoachInfo(coachId);

    if (Platform.OS === "web") {
      const webLogo = coachInfo?.logoUrl ? await toDataUri(coachInfo.logoUrl) : null;
      const webCoachInfo = coachInfo ? { ...coachInfo, logoUrl: webLogo } : null;
      const html = buildHtml(webCoachInfo);
      const rendered = await renderHtmlToCanvas(html, ".no-split");
      await canvasToPdfDownload(rendered, sanitizeFileName(fileBaseName, "rapport"), preOpenedWindow);
      return;
    }

    const html = buildHtml(coachInfo);
    const { uri } = await Print.printToFileAsync({ html });
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle,
        UTI: "com.adobe.pdf",
      });
    }
  } catch (error) {
    preOpenedWindow?.close();
    throw error;
  }
}

export async function downloadWellnessReportPdf(opts: {
  sportifName: string;
  coachId: string;
  entriesDesc: WellnessEntry[];
}): Promise<void> {
  if (opts.entriesDesc.length === 0) {
    throw new Error("Aucun check-in de bien-être enregistré pour ce sportif.");
  }
  await runDownload(
    `Rapport bien-etre - ${opts.sportifName}`,
    (coachInfo) => buildWellnessReportHtml(opts.sportifName, opts.entriesDesc, coachInfo),
    opts.coachId,
    `Rapport bien-être — ${opts.sportifName}`
  );
}

export async function downloadLoadReportPdf(opts: {
  sportifName: string;
  coachId: string;
  sessions: SessionRecord[];
}): Promise<void> {
  if (opts.sessions.length === 0) {
    throw new Error("Aucune séance enregistrée pour ce sportif.");
  }
  await runDownload(
    `Rapport charge - ${opts.sportifName}`,
    (coachInfo) => buildLoadReportHtml(opts.sportifName, opts.sessions, coachInfo),
    opts.coachId,
    `Rapport charge — ${opts.sportifName}`
  );
}
