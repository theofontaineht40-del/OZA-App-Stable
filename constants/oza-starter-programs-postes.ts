// Programmes de démarrage par poste (niveau intermédiaire). Chacun part du
// programme « préparation générale » du sport et le décline selon les exigences
// du poste : on remplace, ajoute ou retire des blocs, puis les séries, RPE et
// repos sont recalculés semaine par semaine (hypertrophie → force → puissance →
// décharge). Importés en BROUILLON, relus puis publiés par l'administrateur.

import { DEFAULT_OZA_SPORTS } from "./oza-sports";
import { GOLD, GREEN, NAVY, ONDE, SKY, StarterProgram, TEAL } from "./oza-starter-programs";
import {
  BlocT,
  ExSpec,
  RUGBY_DEF,
  SPORT_DEFS,
  SeanceT,
  SportDef,
  Slot,
  buildSeances,
} from "./oza-starter-programs-sports";

type Op =
  | { op: "rep"; s: number; nom: string; patch: Partial<BlocT> }
  | { op: "add"; s: number; bloc: BlocT; after?: string }
  | { op: "del"; s: number; nom: string };

const rep = (s: number, nom: string, patch: Partial<BlocT>): Op => ({ op: "rep", s, nom, patch });
const add = (s: number, bloc: BlocT, after?: string): Op => ({ op: "add", s, bloc, after });
const del = (s: number, nom: string): Op => ({ op: "del", s, nom });

const bloc = (slot: Slot, nom: string, objectif: string, exos: ExSpec[], couleur = GOLD, intermediaireOnly = false): BlocT => ({
  slot,
  nom,
  objectif,
  couleur,
  exos,
  ...(intermediaireOnly ? { intermediaireOnly } : {}),
});

const LATERAL = bloc("vitesse", "Changements de direction", "Appuis, freinage et relance latérale.", [{ id: "deplacement-lateral-adduction", reps: "10 m" }], SKY);
const AEROBIE = bloc("cardio", "Capacité aérobie", "Tenir l'intensité sur toute la durée du match.", [{ id: "rameur", reps: "3 min" }], GREEN, true);
const ISCHIOS = bloc("accessoire", "Ischio-jambiers", "Prévention : première blessure du sprinteur.", [{ id: "leg-curl" }], GOLD);
const PORTES = bloc("accessoire", "Portés", "Force fonctionnelle, tenue sous charge.", [{ id: "farmer-walk", reps: "30 m" }], GOLD);
const COIFFE = bloc("accessoire", "Coiffe des rotateurs", "Santé de l'épaule.", [{ id: "rotation-externe-r1", reps: "15" }], GOLD);
const ROTATION = (nom = "Rotation explosive", objectif = "Transmettre la force du sol aux bras."): BlocT =>
  bloc("power", nom, objectif, [{ id: "swing-baseball-rotation" }], NAVY, true);

type PosteDef = {
  sportId: string;
  id: string;
  objectif: string;
  qualites: { nom: string; pct: number }[];
  consigne?: string;
  ops: Op[];
};

function applyOps(base: SeanceT[], ops: Op[], label: string): SeanceT[] {
  const out: SeanceT[] = base.map((s) => ({ ...s, blocs: s.blocs.map((b) => ({ ...b })) }));
  const index = (s: number, nom: string) => {
    const i = out[s].blocs.findIndex((b) => b.nom === nom);
    if (i < 0) throw new Error(`${label} : bloc « ${nom} » introuvable dans la séance ${s + 1}`);
    return i;
  };
  for (const o of ops) {
    if (o.op === "rep") out[o.s].blocs[index(o.s, o.nom)] = { ...out[o.s].blocs[index(o.s, o.nom)], ...o.patch };
    else if (o.op === "del") out[o.s].blocs.splice(index(o.s, o.nom), 1);
    else out[o.s].blocs.splice(o.after === "^" ? 0 : o.after ? index(o.s, o.after) + 1 : out[o.s].blocs.length, 0, o.bloc);
  }
  return out;
}

const POSTES: PosteDef[] = [
  // ── Rugby ──
  {
    sportId: "rugby", id: "premiere-ligne",
    objectif: "Force maximale et hypertrophie fonctionnelle pour la mêlée et les collisions",
    qualites: [{ nom: "Force maximale", pct: 30 }, { nom: "Hypertrophie fonctionnelle", pct: 25 }, { nom: "Puissance", pct: 15 }, { nom: "Répétition d'efforts", pct: 15 }, { nom: "Cou et trapèzes", pct: 15 }],
    ops: [
      del(0, "Puissance du bas du corps"),
      add(0, bloc("secondaire", "Mêlée : poussée de jambes", "Force de poussée sous le poids de l'adversaire.", [{ id: "presse-cuisses" }], TEAL), "Squat"),
      add(1, bloc("accessoire", "Cou et trapèzes", "Tenir la position en mêlée et au contact.", [{ id: "shrugs", reps: "12" }, { id: "face-pull", reps: "15" }]), "Tirage"),
      rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "10 m" }] }),
    ],
  },
  {
    sportId: "rugby", id: "deuxieme-ligne",
    objectif: "Force, puissance et détente pour la mêlée, les touches et les rucks",
    qualites: [{ nom: "Force", pct: 25 }, { nom: "Puissance", pct: 25 }, { nom: "Répétition d'efforts", pct: 20 }, { nom: "Détente de touche", pct: 15 }, { nom: "Hypertrophie fonctionnelle", pct: 15 }],
    ops: [rep(0, "Puissance du bas du corps", { exos: [{ id: "box-jump" }, { id: "squat-saute" }] }), add(1, PORTES, "Tirage")],
  },
  {
    sportId: "rugby", id: "troisieme-ligne",
    objectif: "Puissance, vitesse et capacité aérobie pour couvrir le terrain",
    qualites: [{ nom: "Puissance", pct: 25 }, { nom: "Vitesse", pct: 20 }, { nom: "Force", pct: 20 }, { nom: "Capacité aérobie", pct: 20 }, { nom: "Répétition d'efforts", pct: 15 }],
    ops: [rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "20 m" }] }), add(2, AEROBIE, "Répétition d'efforts")],
  },
  {
    sportId: "rugby", id: "demi-de-melee",
    objectif: "Vitesse, agilité et vivacité des passes",
    qualites: [{ nom: "Vitesse", pct: 25 }, { nom: "Agilité", pct: 20 }, { nom: "Puissance", pct: 20 }, { nom: "Force", pct: 15 }, { nom: "Rotation et passes", pct: 10 }, { nom: "Répétition d'efforts", pct: 10 }],
    ops: [
      rep(1, "Poussée horizontale", { exos: [{ id: "developpe-couche-halteres" }] }),
      add(1, ROTATION("Rotation et passes", "Vitesse de rotation du tronc pour les passes longues."), "Poussée horizontale"),
      rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "10 m" }] }),
      add(2, LATERAL, "Vitesse"),
    ],
  },
  {
    sportId: "rugby", id: "demi-d-ouverture",
    objectif: "Rotation, vitesse d'exécution et lucidité sous fatigue",
    qualites: [{ nom: "Rotation", pct: 20 }, { nom: "Vitesse", pct: 20 }, { nom: "Force", pct: 20 }, { nom: "Répétition d'efforts", pct: 20 }, { nom: "Prévention des ischio-jambiers", pct: 20 }],
    ops: [add(0, ISCHIOS, "Charnière et unilatéral"), add(1, ROTATION("Rotation et jeu au pied", "Puissance de rotation pour les passes et le jeu au pied."), "Poussée horizontale")],
  },
  {
    sportId: "rugby", id: "centres",
    objectif: "Puissance de collision et vitesse",
    qualites: [{ nom: "Puissance", pct: 30 }, { nom: "Force", pct: 25 }, { nom: "Vitesse", pct: 20 }, { nom: "Répétition d'efforts", pct: 15 }, { nom: "Rotation", pct: 10 }],
    ops: [rep(0, "Puissance du bas du corps", { exos: [{ id: "box-jump" }] }), add(1, ROTATION("Rotation de percussion"), "Poussée horizontale"), rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "20 m" }] })],
  },
  {
    sportId: "rugby", id: "ailiers",
    objectif: "Vitesse maximale, accélération et explosivité",
    qualites: [{ nom: "Vitesse maximale", pct: 35 }, { nom: "Accélération", pct: 25 }, { nom: "Puissance", pct: 20 }, { nom: "Prévention des ischio-jambiers", pct: 10 }, { nom: "Force", pct: 10 }],
    consigne: "Les sprints sont la priorité : ne les fais jamais fatigué.",
    ops: [
      add(0, ISCHIOS, "Charnière et unilatéral"),
      rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "30 m" }] }),
      del(2, "Portés"),
    ],
  },
  {
    sportId: "rugby", id: "arrieres",
    objectif: "Relances, vitesse et solidité en collision",
    qualites: [{ nom: "Vitesse", pct: 25 }, { nom: "Puissance", pct: 25 }, { nom: "Force", pct: 20 }, { nom: "Répétition de relances", pct: 20 }, { nom: "Prévention", pct: 10 }],
    ops: [add(0, ISCHIOS, "Charnière et unilatéral"), rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "20 m" }] }), add(2, AEROBIE, "Répétition d'efforts")],
  },

  // ── Football ──
  {
    sportId: "football", id: "gardien",
    objectif: "Explosivité, détente, réactivité et solidité des épaules",
    qualites: [{ nom: "Explosivité", pct: 30 }, { nom: "Détente", pct: 20 }, { nom: "Force", pct: 20 }, { nom: "Réactivité", pct: 15 }, { nom: "Santé de l'épaule", pct: 15 }],
    ops: [
      rep(0, "Détente", { exos: [{ id: "cmj" }, { id: "box-jump" }] }),
      rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "5 m" }] }),
      add(1, LATERAL, "Vitesse"),
      del(1, "Répétition de sprints"),
      add(2, COIFFE, "Épaules"),
    ],
  },
  {
    sportId: "football", id: "defenseur-central",
    objectif: "Force, duel aérien, puissance et relances",
    qualites: [{ nom: "Force", pct: 30 }, { nom: "Puissance", pct: 20 }, { nom: "Détente", pct: 15 }, { nom: "Vitesse", pct: 15 }, { nom: "Duels", pct: 10 }, { nom: "Prévention", pct: 10 }],
    ops: [add(0, PORTES, "Unilatéral et charnière"), rep(2, "Poussée", { exos: [{ id: "developpe-couche" }] })],
  },
  {
    sportId: "football", id: "lateral",
    objectif: "Vitesse, répétition de sprints et endurance de course",
    qualites: [{ nom: "Répétition de sprints", pct: 25 }, { nom: "Vitesse", pct: 25 }, { nom: "Capacité aérobie", pct: 20 }, { nom: "Force unilatérale", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "30 m" }] }), add(1, AEROBIE, "Répétition de sprints")],
  },
  {
    sportId: "football", id: "milieu-defensif",
    objectif: "Capacité aérobie, force, duels et répétition d'efforts",
    qualites: [{ nom: "Capacité aérobie", pct: 25 }, { nom: "Force", pct: 25 }, { nom: "Répétition d'efforts", pct: 20 }, { nom: "Duels", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [add(0, PORTES, "Unilatéral et charnière"), add(1, AEROBIE, "Répétition de sprints"), rep(2, "Poussée", { exos: [{ id: "developpe-couche-halteres" }] })],
  },
  {
    sportId: "football", id: "milieu-offensif",
    objectif: "Agilité, changements de direction et répétition de sprints",
    qualites: [{ nom: "Agilité", pct: 25 }, { nom: "Vitesse", pct: 25 }, { nom: "Répétition de sprints", pct: 20 }, { nom: "Force unilatérale", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [add(1, LATERAL, "Vitesse"), add(1, AEROBIE, "Répétition de sprints")],
  },
  {
    sportId: "football", id: "ailier",
    objectif: "Vitesse maximale, accélération et répétition de sprints",
    qualites: [{ nom: "Vitesse maximale", pct: 30 }, { nom: "Accélération", pct: 25 }, { nom: "Répétition de sprints", pct: 20 }, { nom: "Prévention des ischio-jambiers", pct: 15 }, { nom: "Force", pct: 10 }],
    consigne: "Les sprints sont la priorité : ne les fais jamais fatigué.",
    ops: [rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "30 m" }] })],
  },
  {
    sportId: "football", id: "attaquant",
    objectif: "Accélération, puissance, force sur appuis et finition",
    qualites: [{ nom: "Accélération", pct: 25 }, { nom: "Puissance", pct: 25 }, { nom: "Force", pct: 20 }, { nom: "Vitesse", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "20 m" }] }), rep(2, "Poussée", { exos: [{ id: "developpe-couche" }] }), add(2, ROTATION("Frappe : rotation", "Puissance de rotation du tronc pour la frappe."), "Poussée")],
  },

  // ── Basket-ball ──
  {
    sportId: "basket", id: "meneur",
    objectif: "Vitesse, agilité et endurance de répétition",
    qualites: [{ nom: "Agilité", pct: 30 }, { nom: "Vitesse", pct: 25 }, { nom: "Détente", pct: 15 }, { nom: "Répétition d'efforts", pct: 15 }, { nom: "Prévention de la cheville", pct: 15 }],
    ops: [add(1, LATERAL, "Vitesse courte")],
  },
  {
    sportId: "basket", id: "arriere",
    objectif: "Détente, vitesse et force pour finir près du cercle",
    qualites: [{ nom: "Détente", pct: 30 }, { nom: "Vitesse", pct: 20 }, { nom: "Force", pct: 20 }, { nom: "Agilité", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [add(1, LATERAL, "Vitesse courte")],
  },
  {
    sportId: "basket", id: "ailier",
    objectif: "Détente, vitesse et force polyvalentes",
    qualites: [{ nom: "Détente", pct: 25 }, { nom: "Vitesse", pct: 25 }, { nom: "Force", pct: 20 }, { nom: "Agilité", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [rep(1, "Vitesse courte", { exos: [{ id: "sprint", reps: "15 m" }] })],
  },
  {
    sportId: "basket", id: "ailier-fort",
    objectif: "Force, détente et puissance pour le rebond et le jeu intérieur",
    qualites: [{ nom: "Force", pct: 30 }, { nom: "Détente", pct: 25 }, { nom: "Puissance", pct: 20 }, { nom: "Vitesse", pct: 10 }, { nom: "Prévention", pct: 15 }],
    ops: [add(0, PORTES, "Charnière et unilatéral"), rep(2, "Poussée verticale", { exos: [{ id: "developpe-couche" }] })],
  },
  {
    sportId: "basket", id: "pivot",
    objectif: "Force, puissance sous le cercle et solidité des appuis",
    qualites: [{ nom: "Force", pct: 35 }, { nom: "Puissance", pct: 25 }, { nom: "Détente", pct: 15 }, { nom: "Solidité des appuis", pct: 15 }, { nom: "Prévention", pct: 10 }],
    ops: [add(0, PORTES, "Charnière et unilatéral"), del(1, "Vitesse courte"), rep(2, "Poussée verticale", { exos: [{ id: "developpe-couche" }] })],
  },

  // ── Handball ──
  {
    sportId: "handball", id: "gardien",
    objectif: "Réactivité, détente, souplesse et vitesse de membres",
    qualites: [{ nom: "Réactivité", pct: 25 }, { nom: "Détente", pct: 20 }, { nom: "Souplesse", pct: 20 }, { nom: "Force", pct: 20 }, { nom: "Vitesse de membres", pct: 15 }],
    ops: [
      add(0, bloc("accessoire", "Mobilité de hanche", "Amplitude pour les écarts et les arrêts bas.", [{ id: "etirement-fessier-debout", reps: "30 s / côté" }], SKY), "Charnière et unilatéral"),
      del(1, "Rotation explosive"),
      rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "5 m" }] }),
      add(2, LATERAL, "Vitesse"),
    ],
  },
  {
    sportId: "handball", id: "ailier",
    objectif: "Vitesse, détente et appuis pour tirer en suspension",
    qualites: [{ nom: "Vitesse", pct: 25 }, { nom: "Détente", pct: 25 }, { nom: "Puissance de lancer", pct: 20 }, { nom: "Force", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [add(0, bloc("power", "Détente", "Sauter loin et haut en tir en suspension.", [{ id: "box-jump" }], NAVY, true), "^"), rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "20 m" }] })],
  },
  {
    sportId: "handball", id: "arriere",
    objectif: "Puissance de tir, force et rotation",
    qualites: [{ nom: "Puissance de lancer", pct: 30 }, { nom: "Force", pct: 25 }, { nom: "Rotation", pct: 20 }, { nom: "Santé de l'épaule", pct: 15 }, { nom: "Répétition d'efforts", pct: 10 }],
    ops: [add(1, bloc("power", "Chaîne cinétique du tir", "Transmettre la force des jambes au bras.", [{ id: "rotation-landmine" }], NAVY, true), "Rotation explosive")],
  },
  {
    sportId: "handball", id: "demi-centre",
    objectif: "Vitesse, appuis, répétition d'efforts et organisation du jeu",
    qualites: [{ nom: "Vitesse", pct: 25 }, { nom: "Appuis", pct: 20 }, { nom: "Répétition d'efforts", pct: 20 }, { nom: "Puissance de lancer", pct: 20 }, { nom: "Force", pct: 15 }],
    ops: [rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "15 m" }] }), add(2, LATERAL, "Vitesse")],
  },
  {
    sportId: "handball", id: "pivot",
    objectif: "Force, duels et puissance de contact",
    qualites: [{ nom: "Force", pct: 35 }, { nom: "Puissance de contact", pct: 25 }, { nom: "Haut du corps", pct: 15 }, { nom: "Répétition d'efforts", pct: 15 }, { nom: "Prévention", pct: 10 }],
    ops: [add(0, PORTES, "Charnière et unilatéral"), rep(2, "Vitesse", { exos: [{ id: "sprint", reps: "10 m" }] })],
  },

  // ── Volley-ball ──
  {
    sportId: "volley", id: "passeur",
    objectif: "Vitesse de déplacement, épaules et endurance de répétition",
    qualites: [{ nom: "Vitesse de déplacement", pct: 25 }, { nom: "Santé de l'épaule", pct: 20 }, { nom: "Détente", pct: 20 }, { nom: "Force", pct: 20 }, { nom: "Répétition d'efforts", pct: 15 }],
    ops: [rep(1, "Détente", { exos: [{ id: "cmj" }] }), add(1, LATERAL, "Détente")],
  },
  {
    sportId: "volley", id: "receptionneur-attaquant",
    objectif: "Détente, puissance d'attaque et endurance de réception",
    qualites: [{ nom: "Détente", pct: 30 }, { nom: "Puissance d'attaque", pct: 25 }, { nom: "Force des jambes", pct: 20 }, { nom: "Santé de l'épaule", pct: 15 }, { nom: "Prévention", pct: 10 }],
    ops: [add(2, ROTATION("Rotation d'attaque", "Puissance de rotation pour frapper le ballon."), "Poussée verticale")],
  },
  {
    sportId: "volley", id: "pointu",
    objectif: "Puissance d'attaque maximale et détente",
    qualites: [{ nom: "Puissance d'attaque", pct: 30 }, { nom: "Détente", pct: 30 }, { nom: "Force", pct: 20 }, { nom: "Santé de l'épaule", pct: 20 }],
    ops: [add(2, ROTATION("Rotation d'attaque", "Puissance de rotation pour frapper le ballon."), "Poussée verticale"), add(2, COIFFE, "Coiffe des rotateurs")],
  },
  {
    sportId: "volley", id: "central",
    objectif: "Détente explosive pour le bloc, attaque rapide et appuis latéraux",
    qualites: [{ nom: "Détente", pct: 35 }, { nom: "Appuis latéraux", pct: 20 }, { nom: "Force des jambes", pct: 20 }, { nom: "Puissance d'attaque", pct: 15 }, { nom: "Prévention", pct: 10 }],
    ops: [rep(1, "Détente", { exos: [{ id: "box-jump" }, { id: "cmj" }] }), add(1, LATERAL, "Détente")],
  },
  {
    sportId: "volley", id: "libero",
    objectif: "Agilité, déplacements latéraux, réactivité et endurance de défense",
    qualites: [{ nom: "Agilité", pct: 30 }, { nom: "Déplacements latéraux", pct: 25 }, { nom: "Réactivité", pct: 20 }, { nom: "Force des jambes", pct: 15 }, { nom: "Prévention", pct: 10 }],
    ops: [rep(1, "Détente", { nom: "Réactivité et appuis", slot: "vitesse", objectif: "Démarrer vite sur de très courtes distances.", exos: [{ id: "sprint", reps: "5 m" }], intermediaireOnly: false }), add(1, LATERAL, "Réactivité et appuis"), rep(2, "Poussée verticale", { exos: [{ id: "developpe-couche-halteres" }] })],
  },
];

const DEFS = new Map<string, SportDef>([...SPORT_DEFS, RUGBY_DEF].map((d) => [d.sportId, d]));

function posteProgram(p: PosteDef): StarterProgram {
  const def = DEFS.get(p.sportId);
  const sport = DEFAULT_OZA_SPORTS.find((s) => s.id === p.sportId);
  const position = sport?.positions.find((x) => x.id === p.id);
  if (!def || !sport || !position) throw new Error(`Poste inconnu : ${p.sportId}/${p.id}`);
  const seances = applyOps(def.seances, p.ops, `${p.sportId}/${p.id}`);
  const ondes = def.onde ?? ONDE;
  return {
    id: `starter-${p.sportId}-${p.id}`,
    sportId: p.sportId,
    positionId: p.id,
    nom: `${sport.nom} · ${position.nom}`,
    objectif: p.objectif,
    publicCible: `Joueur régulier depuis plus d'un an, poste : ${position.nom.toLowerCase()}`,
    niveau: "intermediaire",
    seancesParSemaine: seances.length,
    materiel: def.materiel,
    qualites: p.qualites,
    semaines: [0, 1, 2, 3].map((w) => ({
      numero: w + 1,
      theme: ondes[w].theme,
      consignes: [ondes[w].consignes, p.consigne].filter(Boolean).join(" "),
      seances: buildSeances(`${p.sportId}-${p.id}`, "intermediaire", w, seances, ondes[w]),
    })),
  };
}

export const POSTE_STARTER_PROGRAMS: StarterProgram[] = POSTES.map(posteProgram);
