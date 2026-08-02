import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDxFyM63pHu8muxwzehycjddwH8SkQGWGY",
  authDomain: "oza-app-1911c.firebaseapp.com",
  projectId: "oza-app-1911c",
  storageBucket: "oza-app-1911c.firebasestorage.app",
  messagingSenderId: "337824915714",
  appId: "1:337824915714:web:f2e25c7854aeba729c221b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);