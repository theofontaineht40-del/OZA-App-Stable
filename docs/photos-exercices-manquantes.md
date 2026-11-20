# Photos d'exercices manquantes (11)

Les images de la banque sont des rendus 3D anatomiques générés (1536 × 1024, fond blanc,
deux positions côte à côte, muscles sollicités en rose, baskets roses, short noir, logo OZA
rose en haut à gauche). Pour que les nouvelles soient identiques, utilise le même générateur
avec ce **gabarit commun**, en remplaçant `[EXERCICE]` et `[MUSCLES]` :

> Rendu 3D anatomique réaliste, athlète masculin musclé, peau grise avec fibres musculaires
> visibles, short noir, baskets roses. Deux positions du mouvement « [EXERCICE] » côte à côte
> (départ à gauche, fin du mouvement à droite), vue de profil, fond blanc uni, ombre douce au
> sol. Muscles sollicités ([MUSCLES]) surlignés en rose vif. Logo « OZA » rose en haut à
> gauche. Format paysage 1536×1024, style identique à une planche d'exercice de magazine
> de musculation.

| Fichier à créer (dans `assets/exercise-library/`) | [EXERCICE] | [MUSCLES] |
| --- | --- | --- |
| `pompes.png` | Pompes (haut : bras tendus ; bas : poitrine près du sol) | pectoraux, triceps, deltoïdes antérieurs |
| `hollow-body.png` | Hollow body hold (gainage creux : lombaires plaquées, bras et jambes tendus) | abdominaux |
| `russian-twist.png` | Russian twist (assis, buste incliné, rotation du tronc à gauche puis à droite) | obliques, abdominaux |
| `mountain-climbers.png` | Mountain climbers (position de planche haute, genoux alternés vers la poitrine) | abdominaux, fléchisseurs de hanche |
| `burpees.png` | Burpees (planche en bas, puis saut bras en l'air) | corps entier |
| `corde-a-sauter.png` | Corde à sauter (deux positions du saut, corde visible) | mollets, épaules |
| `sprint.png` | Sprint (départ penché, puis pleine foulée) | quadriceps, ischio-jambiers, fessiers |
| `box-jump.png` | Box jump (réception accroupie devant le box, puis debout sur le box) | quadriceps, fessiers |
| `farmer-walk.png` | Farmer's walk (marche avec une haltère lourde dans chaque main, deux pas) | avant-bras, trapèzes, gainage |
| `battle-ropes.png` | Battle ropes (ondulations alternées des deux cordes, bras haut puis bras bas) | épaules, bras |
| `gainage-lateral.png` | Gainage latéral (planche sur l'avant-bras, corps aligné, bassin haut) | obliques, fessiers |

## Les brancher

1. Dépose les images dans `assets/exercise-library/` en gardant **exactement** ces noms
   (`.png` ou `.jpg`).
2. Lance `python3 scripts/wire-exercise-photos.py` : le script ajoute le `photoUrl` des
   exercices dont le fichier existe.
3. Pousse sur GitHub : les images sont servies par jsDelivr depuis la branche `main`
   (comptez quelques minutes avant qu'elles apparaissent).
