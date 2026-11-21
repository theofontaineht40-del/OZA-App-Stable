# Référentiel scientifique OZA

Base de connaissances qui alimente le moteur de prescription. **Du TypeScript pur et du JSON** : rien ici n'importe React, Expo ou Firebase, pour que tout soit testable avec Node.

## Les trois couches (toujours séparées)

| Couche | Où | Rôle |
|---|---|---|
| Règles scientifiques | `science/data/` (JSON versionné dans git) | Sources, règles A à J, modèles de sport, métadonnées d'exercices |
| Moteur | `science/engine/` (phase 4) | Choisit et calcule la prescription à partir du profil et des règles validées |
| Interface et données utilisateur | `app/`, `components/`, Firestore | Affiche, saisit, enregistre. **Aucune règle scientifique en dur ici.** |

L'IA ne crée jamais de règle ni de référence : elle choisit parmi les règles validées et explique.

## Règles d'or

1. **Aucune règle sans source.** Une règle « valide » cite au moins une source dont le DOI/PMID a été **ouvert et vérifié à la main** (`verified: true` + `verifiedAt`).
2. **Seul le responsable scientifique (le coach) valide** : `status: "valide"` + `validatedBy` + `validatedAt`. Le moteur ignore tout ce qui est `brouillon` ou `refuse`.
3. **Ne jamais inventer** une valeur, une source ou un DOI. Valeur inconnue = `null`.
4. **Une règle précise sa population** (`population`, `sportIds`, `positionIds`, `byLevel`) : pas d'extrapolation des pros aux amateurs sans le dire dans `limits`.
5. **Un changement = nouvelle `version`** de la règle. L'historique est dans git.

## Ajouter une règle

1. Copier `templates/source.template.json` dans `data/sources.json` (si la source n'existe pas), laisser `verified: false`.
2. Ouvrir le DOI ou chercher le PMID, vérifier que l'étude existe et dit bien ce qu'on lui fait dire, puis passer `verified: true` avec la date.
3. Copier `templates/rule.template.json` dans le bon fichier de `data/rules/` (A à J), le remplir, laisser `status: "brouillon"`.
4. `npm run science:check` : le contrôle signale toute incohérence.
5. Une fois relue, passer la règle à `status: "valide"` avec `validatedBy` et `validatedAt`.

Commandes :

```bash
npm run science:check   # contrôle du référentiel (erreurs et avertissements)
npm run test:science    # tests unitaires
```

## Les 10 catégories

A volume par groupe musculaire · B intensité, répétitions, RPE/RIR, repos · C fréquence et répartition · D progression, périodisation, décharge · E vitesse, sprint, pliométrie · F filières énergétiques et intermittent · G prévention des blessures · H équilibres et patterns · I charge d'entraînement et risque · J populations particulières.

## Traçabilité

Chaque programme généré par le moteur garde une `PrescriptionTrace` (`types.ts`) : version du moteur, copie du profil, règles utilisées (`ruleId` + `version`) et **lacunes** (règles voulues mais absentes ou non validées). Le coach valide ou refuse la prescription avant qu'elle soit utilisée.

## Import des recherches (phase 3)

Le prompt de recherche (section 6, sortie JSON) produit les données d'un sport. Elles sont converties en règles `brouillon` et en sources `verified: false`, puis relues une par une.
