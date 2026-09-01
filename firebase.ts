import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
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

// getAuth() seul persiste bien la session sur le web (localStorage par
// défaut) mais PAS sur iOS/Android : sans persistance explicite, le SDK
// Firebase Auth reste en mémoire sur React Native et l'utilisateur se
// retrouve déconnecté à chaque redémarrage de l'app — d'où "je dois
// retaper mon mot de passe à chaque fois". initializeAuth + AsyncStorage
// règle ça sur natif ; le web garde son comportement par défaut inchangé.
export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);
export const storage = getStorage(app);
