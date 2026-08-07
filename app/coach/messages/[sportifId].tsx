import { useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { View } from "react-native";

import ChatThread from "../../../components/chat-thread";
import { Colors } from "../../../constants/colors";
import { auth, db } from "../../../firebase";
import { ensureConversation } from "../../../services/messages";

export default function CoachThreadScreen() {
  const { sportifId } = useLocalSearchParams<{ sportifId: string }>();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sportifName, setSportifName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCoachId(user?.uid ?? null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!coachId || !sportifId) return;

    // Repart de zéro à chaque changement de sportif : sans ça, le nom dans
    // l'en-tête pouvait déjà pointer vers la nouvelle personne pendant que
    // les messages affichés étaient encore ceux de l'ancienne conversation.
    setConversationId(null);
    setSportifName("");

    let cancelled = false;

    (async () => {
      try {
        const [coachSnap, sportifSnap] = await Promise.all([
          getDoc(doc(db, "users", coachId)),
          getDoc(doc(db, "users", sportifId)),
        ]);
        if (cancelled) return;
        const coachData = coachSnap.data();
        const sportifData = sportifSnap.data();
        const coachName = `${coachData?.firstName ?? ""} ${coachData?.lastName ?? ""}`.trim();
        const sName = `${sportifData?.firstName ?? ""} ${sportifData?.lastName ?? ""}`.trim();

        const id = await ensureConversation(coachId, sportifId, coachName, sName);
        if (cancelled) return;
        setSportifName(sName);
        setConversationId(id);
      } catch {
        // Lecture refusée : rien à afficher, l'écran reste vide plutôt que de planter.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sportifId, coachId]);

  if (!conversationId || !coachId) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <ChatThread
      key={conversationId}
      conversationId={conversationId}
      currentUserId={coachId}
      currentUserRole="coach"
      otherName={sportifName}
    />
  );
}
