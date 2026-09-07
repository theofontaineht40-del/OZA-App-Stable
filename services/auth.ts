import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
  
  import { doc, setDoc } from "firebase/firestore";

  import { auth, db } from "../firebase";
  import { generateCoachCode } from "./tracking";

  export async function registerUser(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: "coach" | "sportif"
  ) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email,
      role,
      createdAt: new Date(),
      ...(role === "coach" ? { coachCode: generateCoachCode() } : {}),
    });

    return user;
  }
  
  export async function loginUser(
    email: string,
    password: string
  ) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  
    return userCredential.user;
  }

  export async function logoutUser() {
    await signOut(auth);
  }

  // Envoie l'email standard Firebase de réinitialisation de mot de passe —
  // ne dit jamais si l'email existe ou non (comportement Firebase), pour ne
  // pas révéler quels emails sont déjà des comptes.
  export async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }
