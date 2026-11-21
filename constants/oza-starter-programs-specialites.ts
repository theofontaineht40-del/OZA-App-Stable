// Programmes de démarrage par spécialité, axe ou objectif : course (5 km à
// trail), tennis, athlétisme, combat, natation, cyclisme, triathlon, CrossFit,
// Hyrox et musculation. Même principe que les programmes par poste : on part de
// la préparation générale du sport et on remplace, ajoute ou retire des blocs
// selon les exigences de la spécialité. Importés en BROUILLON, relus puis
// publiés par l'administrateur.

import { GOLD, GREEN, NAVY, SKY, StarterProgram, TEAL } from "./oza-starter-programs";
import {
  AEROBIE,
  COIFFE,
  ISCHIOS,
  LATERAL,
  PORTES,
  PosteDef,
  ROTATION,
  add,
  bloc,
  del,
  posteProgram,
  rep,
} from "./oza-starter-programs-postes";
import type { BlocT, ExSpec } from "./oza-starter-programs-sports";

const circuit = (nom: string, objectif: string, exos: ExSpec[], couleur = TEAL): BlocT => ({
  ...bloc("circuit", nom, objectif, exos, couleur),
  mode: "circuit",
});
const mobilite = (objectif = "Garder de l'amplitude de hanche."): BlocT =>
  bloc("accessoire", "Mobilité de hanche", objectif, [{ id: "etirement-fessier-debout", reps: "30 s / côté" }], SKY);
const SPEC_DEFAULT: Pick<PosteDef, "onde"> = { onde: "default" };

const SPECIALITES: PosteDef[] = [
  // ── Course à pied ──
  {
    sportId: "course", id: "5km",
    objectif: "Économie de course et vitesse : renforcer pour courir vite sur 5 km",
    qualites: [{ nom: "Économie de course", pct: 25 }, { nom: "Force des jambes", pct: 25 }, { nom: "Vitesse", pct: 20 }, { nom: "Gainage", pct: 20 }, { nom: "Prévention", pct: 10 }],
    ops: [add(2, bloc("vitesse", "Vitesse", "Accélérations courtes pour la foulée et le finish.", [{ id: "sprint", reps: "20 m" }], NAVY), "Rebonds")],
  },
  {
    sportId: "course", id: "10km",
    objectif: "Force-endurance et économie de course pour tenir l'allure sur 10 km",
    qualites: [{ nom: "Force des jambes", pct: 30 }, { nom: "Économie de course", pct: 25 }, { nom: "Gainage", pct: 20 }, { nom: "Endurance de force", pct: 15 }, { nom: "Prévention", pct: 10 }],
    ops: [add(0, bloc("accessoire", "Endurance de force", "Tenir la qualité de foulée quand la fatigue arrive.", [{ id: "fentes-marchees", reps: "20 m" }], GREEN))],
  },
  {
    sportId: "course", id: "semi",
    objectif: "Robustesse et endurance de force pour tenir un semi-marathon",
    qualites: [{ nom: "Endurance de force", pct: 30 }, { nom: "Force des jambes", pct: 25 }, { nom: "Gainage", pct: 20 }, { nom: "Prévention", pct: 15 }, { nom: "Économie de course", pct: 10 }],
    ops: [add(0, bloc("accessoire", "Endurance de force", "Tenir la qualité de foulée sur la durée.", [{ id: "fentes-marchees", reps: "20 m" }], GREEN)), add(1, bloc("accessoire", "Prévention", "Hanches et ischio-jambiers.", [{ id: "planche-copenhague", reps: "20 s / côté" }, { id: "leg-curl" }]), "Hanches")],
  },
  {
    sportId: "course", id: "marathon",
    objectif: "Robustesse, prévention et endurance musculaire pour finir un marathon",
    qualites: [{ nom: "Prévention des blessures", pct: 30 }, { nom: "Endurance de force", pct: 25 }, { nom: "Force des jambes", pct: 20 }, { nom: "Gainage", pct: 20 }, { nom: "Mobilité", pct: 5 }],
    consigne: "Le volume de course passe avant : réduis le renforcement si tes jambes sont lourdes.",
    ops: [del(2, "Rebonds"), add(1, bloc("accessoire", "Prévention", "Hanches et ischio-jambiers, zones qui lâchent sur la durée.", [{ id: "planche-copenhague", reps: "20 s / côté" }, { id: "leg-curl" }]), "Hanches"), add(0, mobilite())],
  },
  {
    sportId: "course", id: "trail",
    objectif: "Force excentrique, stabilité des chevilles et solidité pour la descente",
    qualites: [{ nom: "Force excentrique", pct: 25 }, { nom: "Stabilité des chevilles", pct: 20 }, { nom: "Force des jambes", pct: 25 }, { nom: "Endurance de force", pct: 15 }, { nom: "Gainage", pct: 15 }],
    ops: [
      add(0, bloc("accessoire", "Descente : excentrique", "Freiner en descente : mouvements lents et contrôlés.", [{ id: "reverse-lunge", reps: "10 / jambe", note: "Descends en 3 secondes, remonte normalement." }], GREEN), "Squat"),
      add(2, bloc("accessoire", "Marche sur les talons", "Renforcer le tibial et les chevilles pour les descentes.", [{ id: "marche-sur-talons", reps: "20 m" }]), "Pieds et chevilles"),
    ],
  },

  // ── Tennis ──
  {
    sportId: "tennis", id: "simple",
    objectif: "Endurance de répétition et déplacements pour tenir de longs échanges",
    qualites: [{ nom: "Répétition d'efforts", pct: 25 }, { nom: "Déplacements", pct: 25 }, { nom: "Force des jambes", pct: 20 }, { nom: "Santé de l'épaule", pct: 20 }, { nom: "Rotation", pct: 10 }],
    ops: [add(0, AEROBIE)],
  },
  {
    sportId: "tennis", id: "double",
    objectif: "Réactivité et explosivité sur de très courtes distances, jeu au filet",
    qualites: [{ nom: "Explosivité", pct: 30 }, { nom: "Réactivité", pct: 25 }, { nom: "Force des jambes", pct: 20 }, { nom: "Santé de l'épaule", pct: 15 }, { nom: "Rotation", pct: 10 }],
    ops: [rep(0, "Première accélération", { exos: [{ id: "sprint", reps: "5 m" }] }), add(0, bloc("power", "Réaction au filet", "Explosivité sur 2 à 3 appuis.", [{ id: "cmj" }], NAVY, true), "Première accélération")],
  },
  {
    sportId: "tennis", id: "service",
    objectif: "Puissance du service : chaîne cinétique jambes, tronc et épaule",
    qualites: [{ nom: "Puissance de rotation", pct: 25 }, { nom: "Puissance d'extension", pct: 20 }, { nom: "Santé de l'épaule", pct: 25 }, { nom: "Force", pct: 20 }, { nom: "Gainage", pct: 10 }],
    ops: [add(1, bloc("secondaire", "Poussée verticale", "Force au-dessus de la tête, comme au service.", [{ id: "developpe-militaire-halteres" }], TEAL), "Poussée"), add(2, ROTATION("Service : chaîne cinétique", "Transmettre la force des jambes au bras."), "Rotation explosive"), add(1, bloc("accessoire", "Rotation externe", "Épaule en sécurité pour répéter les services.", [{ id: "face-pull", reps: "15" }]), "Coiffe des rotateurs")],
  },
  {
    sportId: "tennis", id: "junior",
    level: "debutant",
    objectif: "Développer la coordination, la force de base et l'épaule en sécurité",
    qualites: [{ nom: "Coordination et technique", pct: 35 }, { nom: "Force de base", pct: 25 }, { nom: "Santé de l'épaule", pct: 20 }, { nom: "Gainage", pct: 20 }],
    consigne: "Programme à encadrer par un entraîneur : charges légères, technique d'abord, pas de recherche de charge maximale.",
    ops: [],
  },

  // ── Athlétisme ──
  {
    sportId: "athletisme", id: "sprint",
    objectif: "Vitesse maximale et accélération, avec prévention des ischio-jambiers",
    qualites: [{ nom: "Vitesse maximale", pct: 30 }, { nom: "Accélération", pct: 25 }, { nom: "Puissance", pct: 20 }, { nom: "Force", pct: 15 }, { nom: "Prévention", pct: 10 }],
    consigne: "Les sprints sont la priorité : ne les fais jamais fatigué.",
    ops: [rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "30 m" }] }), add(0, ISCHIOS, "Charnière et unilatéral")],
  },
  {
    sportId: "athletisme", id: "haies",
    objectif: "Vitesse, mobilité active de hanche et coordination pour franchir les haies",
    qualites: [{ nom: "Vitesse", pct: 25 }, { nom: "Mobilité de hanche", pct: 25 }, { nom: "Puissance", pct: 20 }, { nom: "Coordination", pct: 15 }, { nom: "Gainage", pct: 15 }],
    ops: [add(0, mobilite("Mobilité active pour le passage des haies.")), add(0, bloc("accessoire", "Passage de haie", "Mobilité active hanche et genou.", [{ id: "rotation-hanche-genou-leve", reps: "10 / côté" }], SKY), "Charnière et unilatéral"), rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "15 m" }] })],
  },
  {
    sportId: "athletisme", id: "demi-fond",
    objectif: "Force, économie de course et vitesse terminale pour le demi-fond",
    qualites: [{ nom: "Force des jambes", pct: 25 }, { nom: "Économie de course", pct: 25 }, { nom: "Vitesse terminale", pct: 20 }, { nom: "Gainage", pct: 20 }, { nom: "Prévention", pct: 10 }],
    ops: [rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "40 m" }] }), del(1, "Balancé"), rep(1, "Pliométrie", { exos: [{ id: "cmj" }] })],
  },
  {
    sportId: "athletisme", id: "sauts",
    objectif: "Puissance, détente et vitesse de course pour les sauts",
    qualites: [{ nom: "Puissance", pct: 30 }, { nom: "Détente", pct: 25 }, { nom: "Vitesse de course", pct: 20 }, { nom: "Force", pct: 15 }, { nom: "Prévention", pct: 10 }],
    ops: [rep(1, "Pliométrie", { exos: [{ id: "cmj" }, { id: "box-jump" }, { id: "squat-saute" }] }), rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "20 m" }] }), add(0, ISCHIOS, "Charnière et unilatéral")],
  },
  {
    sportId: "athletisme", id: "lancers",
    objectif: "Force maximale et puissance de rotation pour les lancers",
    qualites: [{ nom: "Force maximale", pct: 30 }, { nom: "Puissance de rotation", pct: 25 }, { nom: "Puissance", pct: 20 }, { nom: "Santé de l'épaule", pct: 15 }, { nom: "Gainage", pct: 10 }],
    ops: [rep(1, "Vitesse", { exos: [{ id: "sprint", reps: "10 m" }] }), add(2, ROTATION("Rotation de lancer", "Transmettre la force des jambes au lancer."), "Poussée"), rep(2, "Poussée", { exos: [{ id: "developpe-couche" }] }), add(2, COIFFE, "Tirage")],
  },
  {
    sportId: "athletisme", id: "combine",
    objectif: "Polyvalence : vitesse, force, détente et capacité de travail pour les épreuves combinées",
    qualites: [{ nom: "Vitesse", pct: 25 }, { nom: "Force", pct: 25 }, { nom: "Détente", pct: 20 }, { nom: "Capacité de travail", pct: 20 }, { nom: "Prévention", pct: 10 }],
    ops: [add(0, PORTES, "Charnière et unilatéral"), add(1, AEROBIE, "Balancé")],
  },

  // ── Sports de combat ──
  {
    sportId: "combat", id: "boxe",
    objectif: "Puissance de rotation, endurance de rounds et épaules solides",
    qualites: [{ nom: "Puissance de rotation", pct: 25 }, { nom: "Endurance de rounds", pct: 25 }, { nom: "Force", pct: 20 }, { nom: "Santé de l'épaule", pct: 15 }, { nom: "Gainage", pct: 15 }],
    ops: [add(1, COIFFE, "Tirage"), rep(2, "Circuit de combat", { exos: [{ id: "corde-a-sauter", reps: "45 s" }, { id: "battle-ropes", reps: "20 s" }, { id: "mountain-climbers", reps: "20 s" }, { id: "pompes", reps: "10" }] })],
  },
  {
    sportId: "combat", id: "mma",
    objectif: "Polyvalence : force, puissance, endurance et cou solide",
    qualites: [{ nom: "Force", pct: 25 }, { nom: "Endurance de combat", pct: 25 }, { nom: "Puissance", pct: 20 }, { nom: "Gainage", pct: 15 }, { nom: "Cou et trapèzes", pct: 15 }],
    ops: [add(1, bloc("accessoire", "Cou et trapèzes", "Encaisser et tenir les saisies.", [{ id: "shrugs", reps: "12" }]), "Tirage"), add(0, PORTES, "Charnière et unilatéral")],
  },
  {
    sportId: "combat", id: "judo",
    objectif: "Force de tirage, saisies et puissance de projection",
    qualites: [{ nom: "Force de tirage", pct: 30 }, { nom: "Saisies", pct: 20 }, { nom: "Puissance de hanche", pct: 20 }, { nom: "Gainage", pct: 15 }, { nom: "Endurance", pct: 15 }],
    ops: [rep(1, "Tirage", { slot: "principal", exos: [{ id: "tractions", note: "Assistées (élastique ou machine) si tu ne fais pas encore le nombre de répétitions demandé." }, { id: "rowing-barre" }] }), add(1, bloc("accessoire", "Saisies", "Tenir le kimono longtemps.", [{ id: "farmer-walk", reps: "30 m" }]), "Tirage"), add(0, bloc("power", "Projection : extension de hanche", "Puissance de hanche pour les projections.", [{ id: "kettlebell-swing", reps: "12" }], NAVY, true), "Charnière et unilatéral")],
  },
  {
    sportId: "combat", id: "lutte",
    objectif: "Force maximale, cou et puissance de hanche",
    qualites: [{ nom: "Force maximale", pct: 30 }, { nom: "Cou et trapèzes", pct: 20 }, { nom: "Puissance de hanche", pct: 20 }, { nom: "Gainage", pct: 15 }, { nom: "Endurance", pct: 15 }],
    ops: [rep(0, "Squat", { exos: [{ id: "squat-avant" }] }), add(0, bloc("accessoire", "Cou et trapèzes", "Résister aux prises.", [{ id: "shrugs", reps: "12" }]), "Squat"), add(0, PORTES, "Charnière et unilatéral")],
  },
  {
    sportId: "combat", id: "jjb",
    objectif: "Mobilité de hanche, gainage au sol et endurance de grip",
    qualites: [{ nom: "Mobilité de hanche", pct: 25 }, { nom: "Gainage", pct: 25 }, { nom: "Force de tirage", pct: 20 }, { nom: "Endurance de grip", pct: 15 }, { nom: "Endurance", pct: 15 }],
    ops: [add(0, mobilite("Amplitude pour les gardes et les passages.")), add(0, bloc("accessoire", "Relevé au sol", "Se relever du sol : transition fréquente en combat au sol.", [{ id: "releve-au-sol-get-up", reps: "5 / côté" }], GREEN), "Charnière et unilatéral"), add(1, bloc("accessoire", "Saisies", "Tenir longtemps.", [{ id: "farmer-walk", reps: "30 m" }]), "Tirage")],
  },
  {
    sportId: "combat", id: "pieds-poings",
    objectif: "Rotation, vitesse, extension de hanche et jambes solides",
    qualites: [{ nom: "Puissance de rotation", pct: 25 }, { nom: "Vitesse", pct: 20 }, { nom: "Extension de hanche", pct: 20 }, { nom: "Endurance de rounds", pct: 20 }, { nom: "Mobilité", pct: 15 }],
    ops: [add(0, bloc("power", "Coup de pied : extension de hanche", "Puissance d'extension de hanche pour les frappes.", [{ id: "kettlebell-swing", reps: "12" }], NAVY, true), "Charnière et unilatéral"), add(0, mobilite("Amplitude de hanche pour les coups de pied."))],
  },

  // ── Natation ──
  {
    sportId: "natation", id: "sprint",
    objectif: "Puissance de départ et force de traction pour la vitesse pure",
    qualites: [{ nom: "Puissance de départ", pct: 25 }, { nom: "Force de traction", pct: 30 }, { nom: "Gainage", pct: 20 }, { nom: "Force des jambes", pct: 15 }, { nom: "Santé de l'épaule", pct: 10 }],
    ops: [rep(1, "Détente de départ", { exos: [{ id: "cmj" }, { id: "box-jump" }] })],
  },
  {
    sportId: "natation", id: "demi-fond",
    objectif: "Endurance de traction, gainage et épaules solides",
    qualites: [{ nom: "Endurance de traction", pct: 30 }, { nom: "Gainage", pct: 25 }, { nom: "Santé de l'épaule", pct: 20 }, { nom: "Force", pct: 15 }, { nom: "Force des jambes", pct: 10 }],
    ops: [del(1, "Détente de départ"), add(0, bloc("accessoire", "Endurance de traction", "Tenir la technique de traction sur la durée.", [{ id: "tirage-vertical", reps: "15" }], GREEN), "Tirage et pull-over")],
  },
  {
    sportId: "natation", id: "fond",
    objectif: "Endurance musculaire, mobilité d'épaule et gainage pour les longues distances",
    qualites: [{ nom: "Endurance de traction", pct: 30 }, { nom: "Santé de l'épaule", pct: 25 }, { nom: "Gainage", pct: 25 }, { nom: "Mobilité d'épaule", pct: 10 }, { nom: "Force", pct: 10 }],
    consigne: "Le volume dans l'eau passe avant : réduis le renforcement si tes épaules sont fatiguées.",
    ops: [del(1, "Détente de départ"), add(0, bloc("accessoire", "Mobilité d'épaule", "Amplitude et santé de l'épaule.", [{ id: "mobilite-epaule", reps: "12" }], SKY), "Épaule")],
  },
  {
    sportId: "natation", id: "eau-libre",
    objectif: "Endurance, stabilité d'épaule et gainage pour nager en milieu ouvert",
    qualites: [{ nom: "Endurance de traction", pct: 25 }, { nom: "Santé de l'épaule", pct: 25 }, { nom: "Gainage", pct: 25 }, { nom: "Rotation du tronc", pct: 15 }, { nom: "Force", pct: 10 }],
    ops: [del(1, "Détente de départ"), add(0, bloc("accessoire", "Stabilité scapulaire", "Épaules solides dans la durée.", [{ id: "tirage-scapulaire", reps: "12" }], GOLD), "Épaule"), add(2, bloc("accessoire", "Rotation du tronc", "Se tourner pour respirer et s'orienter.", [{ id: "rotation-tronc-machine", reps: "12" }], SKY), "Rotation")],
  },

  // ── Cyclisme ──
  {
    sportId: "cyclisme", id: "route",
    objectif: "Force-endurance des jambes, gainage et tenue du dos sur route",
    qualites: [{ nom: "Endurance de force", pct: 30 }, { nom: "Force des jambes", pct: 25 }, { nom: "Gainage et dos", pct: 25 }, { nom: "Mobilité de hanche", pct: 10 }, { nom: "Haut du corps", pct: 10 }],
    ops: [add(0, bloc("accessoire", "Endurance de force", "Tenir une cadence sous charge.", [{ id: "presse-cuisses", reps: "15" }], GREEN), "Unilatéral et presse")],
  },
  {
    sportId: "cyclisme", id: "vtt",
    objectif: "Explosivité, haut du corps et gainage pour le pilotage et les relances",
    qualites: [{ nom: "Explosivité", pct: 25 }, { nom: "Force des jambes", pct: 25 }, { nom: "Haut du corps", pct: 20 }, { nom: "Gainage", pct: 20 }, { nom: "Mobilité", pct: 10 }],
    ops: [add(1, bloc("secondaire", "Poussée et tirage", "Piloter, absorber les chocs.", [{ id: "developpe-couche-halteres" }, { id: "tractions", note: "Assistées (élastique ou machine) si besoin." }], TEAL), "Dos"), rep(2, "Puissance", { exos: [{ id: "box-jump" }] })],
  },
  {
    sportId: "cyclisme", id: "piste",
    objectif: "Puissance maximale et force de départ pour le sprint",
    qualites: [{ nom: "Puissance maximale", pct: 30 }, { nom: "Force des jambes", pct: 30 }, { nom: "Explosivité", pct: 20 }, { nom: "Gainage", pct: 10 }, { nom: "Haut du corps", pct: 10 }],
    ops: [add(0, bloc("power", "Départ", "Puissance d'extension pour le départ arrêté.", [{ id: "cmj" }], NAVY, true), "^"), rep(2, "Puissance", { exos: [{ id: "box-jump" }, { id: "squat-saute" }] })],
  },
  {
    sportId: "cyclisme", id: "gravel",
    objectif: "Endurance, dos et haut du corps solides pour les longues sorties",
    qualites: [{ nom: "Endurance de force", pct: 25 }, { nom: "Gainage et dos", pct: 25 }, { nom: "Force des jambes", pct: 25 }, { nom: "Haut du corps", pct: 15 }, { nom: "Mobilité de hanche", pct: 10 }],
    ops: [add(1, bloc("secondaire", "Poussée et tirage", "Absorber les vibrations, tenir le guidon.", [{ id: "developpe-couche-halteres" }, { id: "tirage-horizontal" }], TEAL), "Dos")],
  },

  // ── Triathlon ──
  {
    sportId: "triathlon", id: "sprint",
    objectif: "Puissance et enchaînements rapides pour un triathlon sprint",
    qualites: [{ nom: "Puissance", pct: 25 }, { nom: "Force des jambes", pct: 25 }, { nom: "Transitions", pct: 20 }, { nom: "Gainage", pct: 20 }, { nom: "Prévention", pct: 10 }],
    ops: [add(2, circuit("Transition vélo-course", "Retrouver ses jambes après le vélo.", [{ id: "fentes-marchees", reps: "10 m" }, { id: "corde-a-sauter", reps: "30 s" }], GOLD), "Rebonds")],
  },
  {
    sportId: "triathlon", id: "olympique",
    objectif: "Force-endurance et solidité pour un triathlon olympique",
    qualites: [{ nom: "Force des jambes", pct: 25 }, { nom: "Gainage et stabilité", pct: 25 }, { nom: "Endurance de force", pct: 20 }, { nom: "Santé de l'épaule", pct: 15 }, { nom: "Prévention", pct: 15 }],
    ops: [add(0, bloc("accessoire", "Endurance de force", "Tenir la foulée et la cadence sur la durée.", [{ id: "fentes-marchees", reps: "20 m" }], GREEN))],
  },
  {
    sportId: "triathlon", id: "70-3",
    objectif: "Robustesse et endurance musculaire pour un format 70.3",
    qualites: [{ nom: "Endurance de force", pct: 30 }, { nom: "Gainage et stabilité", pct: 25 }, { nom: "Prévention", pct: 20 }, { nom: "Force des jambes", pct: 15 }, { nom: "Santé de l'épaule", pct: 10 }],
    consigne: "Le volume d'entraînement passe avant : réduis le renforcement si tu es fatigué.",
    ops: [del(2, "Rebonds"), add(0, bloc("accessoire", "Endurance de force", "Tenir la foulée et la cadence sur la durée.", [{ id: "fentes-marchees", reps: "20 m" }], GREEN)), add(2, mobilite())],
  },
  {
    sportId: "triathlon", id: "ironman",
    objectif: "Robustesse, prévention et dos solide pour la distance Ironman",
    qualites: [{ nom: "Prévention des blessures", pct: 30 }, { nom: "Endurance de force", pct: 25 }, { nom: "Gainage et dos", pct: 25 }, { nom: "Force des jambes", pct: 10 }, { nom: "Mobilité", pct: 10 }],
    consigne: "Le volume d'entraînement passe avant : réduis le renforcement si tu es fatigué.",
    ops: [del(2, "Rebonds"), add(1, bloc("accessoire", "Dos", "Tenir la position en selle des heures.", [{ id: "tirage-horizontal" }], GREEN), "Tirage et épaule"), add(2, mobilite())],
  },

  // ── CrossFit ──
  {
    sportId: "crossfit", id: "halterophilie",
    objectif: "Squat, tirage et puissance de hanche pour les mouvements olympiques",
    qualites: [{ nom: "Puissance de hanche", pct: 30 }, { nom: "Force des jambes", pct: 30 }, { nom: "Mobilité", pct: 20 }, { nom: "Technique", pct: 10 }, { nom: "Gainage", pct: 10 }],
    consigne: "Les mouvements olympiques eux-mêmes se travaillent avec ton entraîneur : ce programme prépare la force, la puissance et la mobilité.",
    ops: [rep(1, "Pliométrie", { exos: [{ id: "box-jump" }, { id: "cmj" }] }), add(0, bloc("accessoire", "Mobilité d'épaule et de cheville", "Amplitude pour recevoir la barre en bas.", [{ id: "mobilite-epaule", reps: "12" }, { id: "montee-pointes-pieds", reps: "15" }], SKY), "Gainage")],
  },
  {
    sportId: "crossfit", id: "gymnastique",
    objectif: "Force au poids du corps : tractions, dips, pompes et gainage",
    qualites: [{ nom: "Force au poids du corps", pct: 35 }, { nom: "Gainage", pct: 25 }, { nom: "Contrôle de l'épaule", pct: 20 }, { nom: "Condition physique", pct: 20 }],
    ops: [rep(1, "Poussée verticale", { exos: [{ id: "dips" }] }), add(1, bloc("gainage", "Gainage", "Tenir la position creuse.", [{ id: "hollow-body", reps: "25 s" }], SKY)), rep(2, "Circuit métabolique", { exos: [{ id: "pompes", reps: "12" }, { id: "hollow-body", reps: "20 s" }, { id: "burpees", reps: "8" }, { id: "corde-a-sauter", reps: "30 s" }] })],
  },
  {
    sportId: "crossfit", id: "conditionnement",
    objectif: "Capacité à enchaîner des mouvements à haute intensité",
    qualites: [{ nom: "Capacité à enchaîner", pct: 35 }, { nom: "Endurance aérobie", pct: 25 }, { nom: "Force", pct: 20 }, { nom: "Puissance", pct: 10 }, { nom: "Gainage", pct: 10 }],
    ops: [add(2, AEROBIE, "Circuit métabolique")],
  },
  {
    sportId: "crossfit", id: "force",
    objectif: "Force maximale aux mouvements de base",
    qualites: [{ nom: "Force maximale", pct: 50 }, { nom: "Force-vitesse", pct: 15 }, { nom: "Gainage", pct: 15 }, { nom: "Hypertrophie", pct: 10 }, { nom: "Condition physique", pct: 10 }],
    ops: [rep(0, "Squat avant", { exos: [{ id: "squat-arriere" }] }), rep(0, "Charnière", { exos: [{ id: "solueve-terre" }] }), rep(1, "Poussée verticale", { exos: [{ id: "developpe-couche" }] }), del(2, "Finisher")],
  },

  // ── Hyrox ──
  {
    sportId: "hyrox", id: "endurance-cardio",
    objectif: "Base aérobie pour enchaîner course et stations sans exploser",
    qualites: [{ nom: "Endurance aérobie", pct: 40 }, { nom: "Force-endurance", pct: 20 }, { nom: "Force des jambes", pct: 20 }, { nom: "Gainage", pct: 10 }, { nom: "Transitions", pct: 10 }],
    ops: [add(0, bloc("cardio", "Endurance aérobie", "Construire la base d'endurance.", [{ id: "velo", reps: "5 min" }], GREEN, true))],
  },
  {
    sportId: "hyrox", id: "force-endurance",
    objectif: "Force-endurance des jambes et du haut du corps pour les stations",
    qualites: [{ nom: "Force-endurance", pct: 40 }, { nom: "Force des jambes", pct: 25 }, { nom: "Portés", pct: 15 }, { nom: "Endurance aérobie", pct: 10 }, { nom: "Gainage", pct: 10 }],
    ops: [add(0, bloc("accessoire", "Endurance de force", "Répéter des efforts de force sans perdre en qualité.", [{ id: "presse-cuisses", reps: "15" }, { id: "fentes-marchees", reps: "20 m" }], GREEN))],
  },
  {
    sportId: "hyrox", id: "capacite-de-travail",
    objectif: "Capacité de travail globale : tenir une intensité élevée longtemps",
    qualites: [{ nom: "Capacité de travail", pct: 35 }, { nom: "Endurance aérobie", pct: 25 }, { nom: "Force-endurance", pct: 20 }, { nom: "Force", pct: 10 }, { nom: "Gainage", pct: 10 }],
    ops: [add(2, circuit("Second circuit", "Allonger le temps de travail.", [{ id: "rameur", reps: "250 m" }, { id: "kettlebell-swing", reps: "12" }, { id: "burpees", reps: "8" }]), "Circuit stations")],
  },
  {
    sportId: "hyrox", id: "transitions",
    objectif: "Enchaîner course et stations : gérer la fatigue d'une station à l'autre",
    qualites: [{ nom: "Transitions", pct: 35 }, { nom: "Capacité de travail", pct: 25 }, { nom: "Endurance aérobie", pct: 20 }, { nom: "Force-endurance", pct: 10 }, { nom: "Gainage", pct: 10 }],
    ops: [add(2, circuit("Transition course-station", "Reprendre la course après une station éprouvante.", [{ id: "fentes-marchees", reps: "20 m" }, { id: "sprint", reps: "50 m" }, { id: "burpees", reps: "8" }], GOLD), "Circuit stations")],
  },
  {
    sportId: "hyrox", id: "sled",
    objectif: "Force de poussée et de traction des jambes pour les stations de traîneau",
    qualites: [{ nom: "Force de poussée", pct: 35 }, { nom: "Force des jambes", pct: 30 }, { nom: "Force-endurance", pct: 15 }, { nom: "Gainage", pct: 10 }, { nom: "Portés", pct: 10 }],
    consigne: "Les départs résistés remplacent le traîneau si tu n'en as pas : pousse bas, dos plat.",
    ops: [add(0, bloc("secondaire", "Poussée de traîneau (substitut)", "Pousser bas, jambes en position basse.", [{ id: "depart-resiste-elastique", reps: "15 m" }, { id: "marche-basse-position-gardee", reps: "20 m" }], GREEN), "Squat"), add(0, bloc("secondaire", "Presse", "Force des jambes en poussée.", [{ id: "presse-cuisses" }], TEAL), "Squat")],
  },
  {
    sportId: "hyrox", id: "running",
    objectif: "Allure et endurance de course pour les 8 km du Hyrox",
    qualites: [{ nom: "Endurance de course", pct: 35 }, { nom: "Vitesse", pct: 20 }, { nom: "Endurance aérobie", pct: 20 }, { nom: "Force des jambes", pct: 15 }, { nom: "Gainage", pct: 10 }],
    consigne: "Ces séances complètent tes sorties de course : elles ne les remplacent pas.",
    ops: [add(1, bloc("vitesse", "Course : intervalles", "Tenir une allure soutenue à répétition.", [{ id: "sprint", reps: "150 m" }], NAVY), "SkiErg")],
  },
  {
    sportId: "hyrox", id: "wall-balls",
    objectif: "Endurance des jambes et des épaules pour les wall balls",
    qualites: [{ nom: "Endurance des jambes", pct: 35 }, { nom: "Endurance des épaules", pct: 25 }, { nom: "Force des jambes", pct: 20 }, { nom: "Gainage", pct: 10 }, { nom: "Endurance aérobie", pct: 10 }],
    consigne: "Les wall balls se simulent avec un squat suivi d'une poussée au-dessus de la tête.",
    ops: [add(2, circuit("Squat et lancer (wall balls)", "Squat profond puis poussée verticale, sans pause.", [{ id: "squat-avant", reps: "12" }, { id: "developpe-militaire-halteres", reps: "12" }, { id: "squat-saute", reps: "10" }]), "Circuit stations")],
  },

  // ── Musculation (objectif) ──
  {
    sportId: "musculation", id: "hypertrophie",
    objectif: "Prendre du muscle : volume élevé sur tous les groupes musculaires",
    qualites: [{ nom: "Hypertrophie", pct: 60 }, { nom: "Force", pct: 25 }, { nom: "Gainage", pct: 10 }, { nom: "Santé de l'épaule", pct: 5 }],
    ops: [add(0, bloc("accessoire", "Pectoraux : isolation", "Finir le travail des pectoraux.", [{ id: "butterfly-pecs", reps: "15" }], SKY), "Poussée verticale")],
  },
  {
    sportId: "musculation", id: "perte-de-poids",
    ...SPEC_DEFAULT,
    objectif: "Perdre du gras en gardant le muscle : musculation et finisher métabolique",
    qualites: [{ nom: "Maintien de la masse musculaire", pct: 40 }, { nom: "Dépense énergétique", pct: 30 }, { nom: "Force", pct: 20 }, { nom: "Gainage", pct: 10 }],
    consigne: "L'alimentation joue un rôle majeur : adapte-la à ton objectif et à ton niveau d'activité.",
    ops: [add(0, bloc("finisher", "Finisher métabolique", "Augmenter la dépense énergétique en fin de séance.", [{ id: "assault-bike" }], GOLD, true)), add(1, bloc("finisher", "Finisher métabolique", "Augmenter la dépense énergétique en fin de séance.", [{ id: "rameur" }], GOLD, true)), add(2, bloc("finisher", "Finisher métabolique", "Augmenter la dépense énergétique en fin de séance.", [{ id: "corde-a-sauter", reps: "30 s" }], GOLD, true))],
  },
  {
    sportId: "musculation", id: "force",
    ...SPEC_DEFAULT,
    objectif: "Devenir plus fort sur les mouvements de base",
    qualites: [{ nom: "Force maximale", pct: 55 }, { nom: "Force-vitesse", pct: 15 }, { nom: "Hypertrophie", pct: 15 }, { nom: "Gainage", pct: 15 }],
    ops: [rep(2, "Charnière et presse", { exos: [{ id: "solueve-terre" }, { id: "presse-cuisses" }] })],
  },
  {
    sportId: "musculation", id: "halterophilie",
    ...SPEC_DEFAULT,
    objectif: "Squat, tirage et puissance de hanche pour progresser en haltérophilie",
    qualites: [{ nom: "Force des jambes", pct: 35 }, { nom: "Puissance de hanche", pct: 25 }, { nom: "Mobilité", pct: 20 }, { nom: "Force de tirage", pct: 10 }, { nom: "Gainage", pct: 10 }],
    consigne: "L'arraché et l'épaulé-jeté se travaillent avec ton entraîneur : ce programme prépare la force, la puissance et la mobilité.",
    ops: [
      rep(0, "Poussée horizontale", { nom: "Squat avant (réception)", objectif: "Force des jambes en position de réception.", exos: [{ id: "squat-avant" }] }),
      rep(2, "Squat", { exos: [{ id: "squat-avant" }] }),
      rep(2, "Charnière et presse", { nom: "Tirage de sol", objectif: "Chaîne postérieure pour le tirage.", exos: [{ id: "solueve-terre" }, { id: "hip-thrust" }] }),
      add(2, bloc("power", "Puissance de saut", "Extension triple : cheville, genou, hanche.", [{ id: "box-jump" }], NAVY, true), "^"),
    ],
  },
  {
    sportId: "musculation", id: "renforcement",
    objectif: "Renforcement musculaire général : gainage, mobilité et force de base",
    qualites: [{ nom: "Force générale", pct: 35 }, { nom: "Gainage", pct: 30 }, { nom: "Hypertrophie légère", pct: 20 }, { nom: "Mobilité", pct: 15 }],
    ops: [add(2, bloc("gainage", "Gainage", "Stabilité du tronc.", [{ id: "gainage-planche", reps: "30 s" }, { id: "hollow-body", reps: "20 s" }], SKY)), add(0, mobilite("Garder de l'amplitude de hanche."))],
  },
];

export const SPECIALITE_STARTER_PROGRAMS: StarterProgram[] = SPECIALITES.map(posteProgram);
