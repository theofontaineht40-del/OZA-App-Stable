// Suggestions de blocs d'entraînement par objectif. OZA propose, le coach décide :
// ces listes ne sont que des présélections indicatives, jamais imposées.
export const BLOCK_SUGGESTIONS: Record<string, string[]> = {
  "Prise de masse": ["Renforcement musculaire", "Volume", "Hypertrophie", "Masse"],
  "Perte de poids": [
    "Cardio basse intensité",
    "Endurance fondamentale",
    "Circuit training",
    "Volume",
    "HIIT",
    "Intermittent",
    "TABATA",
    "Travail lactique",
  ],
  Force: ["Renforcement", "Volume", "Hypertrophie", "Force", "Force-vitesse", "Puissance"],
  Performance: [
    "Coordination",
    "Technique",
    "Vitesse",
    "Puissance",
    "Force",
    "VMA",
    "Lactique",
    "Répétition de sprint",
    "Mobilité",
    "Prévention",
  ],
  "Développement général": ["Renforcement", "Mobilité", "Technique", "Endurance fondamentale", "Volume"],
  "Reprise après blessure": ["Prévention", "Mobilité", "Renforcement", "Technique", "Progressif"],
};

export const OBJECTIFS = Object.keys(BLOCK_SUGGESTIONS);

export const ALL_BLOCKS = Array.from(new Set(Object.values(BLOCK_SUGGESTIONS).flat())).sort();
