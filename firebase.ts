import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
// `getReactNativePersistence` existe bien à l'exécution (résolu par Metro via
// la condition d'export "react-native" du package firebase/auth) mais tsc,
// qui ne suit que la résolution Node par défaut, ne voit que les types web —
// limitation connue et documentée du SDK Firebase sur Expo/React Native.
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDxFyM63pHu8muxwzehycjddwH8SkQGWGY",
  authDomain: "oza-app-1911c.firebaseapp.com",
  projectId: "oza-app-1911c",
  storageBucket: "oza-app-1911c.firebasestorage.app",
  messagingSenderId: "337824915714",
  appId: "1:337824915714:web:f2e25c7854aeba729c221b",
};

const app = initializeApp(firebaseConfig);

// getAuth() par défaut choisit IndexedDB en silence, sans repli si ce stockage
// est indisponible ou bloqué — exactement le cas d'une PWA ajoutée à l'écran
// d'accueil iOS, où WebKit peut refuser ou vider IndexedDB pour ce contexte
// "standalone" sans lever d'erreur visible : la session Firebase se
// retrouvait alors simplement en mémoire, perdue à chaque fermeture. On donne
// donc explicitement une liste de secours (IndexedDB → localStorage →
// sessionStorage) : le SDK teste chacune et retient la première qui marche
// vraiment, au lieu de supposer que la première choisie fonctionne.
//
// Limite à connaître : si iOS applique son nettoyage de stockage après 7
// jours sans ouverture de l'app (ITP), AUCUNE stratégie côté code ne peut
// l'empêcher — c'est une politique de confidentialité de Safari, pas un bug.
// Seule une vraie app native (hors PWA) y échappe.
export const auth =
  Platform.OS === "web"
    ? initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
      })
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);
export const storage = getStorage(app);
