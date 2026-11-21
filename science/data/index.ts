import { ScienceRule, ScienceSource } from "../types";

import sources from "./sources.json";
import A from "./rules/A-volume.json";
import B from "./rules/B-intensite.json";
import C from "./rules/C-frequence.json";
import D from "./rules/D-progression.json";
import E from "./rules/E-vitesse.json";
import F from "./rules/F-filieres.json";
import G from "./rules/G-prevention.json";
import H from "./rules/H-equilibres.json";
import I from "./rules/I-charge.json";
import J from "./rules/J-populations.json";

// Données du référentiel (JSON versionnés dans git). Pour ajouter une règle :
// l'ajouter au bon fichier de science/data/rules/ — voir science/README.md.
export const SOURCES = sources as ScienceSource[];
export const RULES = [A, B, C, D, E, F, G, H, I, J].flat() as ScienceRule[];
