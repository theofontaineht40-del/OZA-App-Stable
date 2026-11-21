# Mini-coach IA : mise en route

Le mini-coach IA rédige un « conseil de la semaine » personnalisé à partir des séances, du bien-être et du profil sportif. Il complète le conseil automatique par règles déjà présent sur l'accueil.

## Comment ça marche

1. Le sportif active le mini-coach (consentement enregistré dans `sportProfiles/{uid}.aiConsentAt`).
2. L'app envoie un résumé chiffré (séances des 7 derniers jours, charge, RPE, bien-être, profil, limitations) à `POST /api/coach-advice` avec son jeton Firebase.
3. La fonction Vercel `api/coach-advice.ts` :
   - vérifie le jeton Firebase et le consentement,
   - limite à un conseil toutes les 6 heures par sportif (transaction Firestore),
   - appelle Claude avec une sortie structurée (verdict, titre, résumé, 3 actions, adaptation des séances),
   - enregistre le résultat dans `coachAdvice/{uid}` (lecture seule côté app, règles Firestore).
4. Ni le nom ni l'email ne sont envoyés. La clé Anthropic reste côté serveur.

## À faire une seule fois

Dans Vercel → projet → Settings → Environment Variables, ajouter :

| Variable | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | ta clé API Anthropic (console.anthropic.com) |
| `COACH_MODEL` | facultatif, défaut `claude-opus-5-5`. `claude-haiku-5-5` coûte environ 30 fois moins cher. |

`FIREBASE_SERVICE_ACCOUNT_JSON` est déjà configurée (rappel de check-in). Puis redéployer le projet.

## Coût indicatif

Environ 1 500 jetons en entrée et 500 en sortie par conseil : de l'ordre de 0,015 $ avec `claude-opus-5-5`, au plus 4 conseils par jour et par sportif. Surveille la consommation dans la console Anthropic.

## Garde-fous

- Consentement explicite avant tout envoi de données.
- Données validées côté serveur (bornes, longueurs) ; les textes libres sont traités comme des données, pas des instructions.
- Le modèle ne pose pas de diagnostic, renvoie vers un professionnel en cas de douleur, et ne propose jamais plus de 10 % de charge en plus d'une semaine à l'autre.
- Si la clé n'est pas configurée, l'app affiche « bientôt disponible » sans erreur.
