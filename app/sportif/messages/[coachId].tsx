import { useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { View } from "react-native";

import ChatThread from "../../../components/chat-thread";
import { Colors } from "../../../constants/colors";
import { auth, db } from "../../../firebase";
import { ensureConversation } from "../../../services/messages";

export default function SportifThreadScreen() {
  const { coachId } = useLocalSearchParams<{ coachId: string }>();
  const [sportifId, setSportifId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSportifId(user?.uid ?? null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!sportifId || !coachId) return;

    (async () => {
      try {
        const [coachSnap, sportifSnap] = await Promise.all([
          getDoc(doc(db, "users", coachId)),
          getDoc(doc(db, "users", sportifId)),
        ]);
        const coachData = coachSnap.data();
        const sportifData = sportifSnap.data();
        const cName = `${coachData?.firstName ?? ""} ${coachData?.lastName ?? ""}`.trim();
        const sName = `${sportifData?.firstName ?? ""} ${sportifData?.lastName ?? ""}`.trim();
        setCoachName(cName);

        const id = await ensureConversation(coachId, sportifId, cName, sName);
        setConversationId(id);
      } catch {
        // Lecture refusée : rien à afficher, l'écran reste vide plutôt que de planter.
      }
    })();
  }, [coachId, sportifId]);

  if (!conversationId || !sportifId) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <ChatThread
      conversationId={conversationId}
      currentUserId={sportifId}
      currentUserRole="sportif"
      otherName={coachName}
    />
  );
}
