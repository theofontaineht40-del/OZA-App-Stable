import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { View } from "react-native";

import ChatThread from "../../../components/chat-thread";
import { Colors } from "../../../constants/colors";
import { auth, db } from "../../../firebase";
import { ensureConversation } from "../../../services/messages";

export default function CoachThreadScreen() {
  const { sportifId } = useLocalSearchParams<{ sportifId: string }>();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sportifName, setSportifName] = useState("");

  useEffect(() => {
    const coachId = auth.currentUser?.uid;
    if (!coachId || !sportifId) return;

    (async () => {
      try {
        const [coachSnap, sportifSnap] = await Promise.all([
          getDoc(doc(db, "users", coachId)),
          getDoc(doc(db, "users", sportifId)),
        ]);
        const coachData = coachSnap.data();
        const sportifData = sportifSnap.data();
        const coachName = `${coachData?.firstName ?? ""} ${coachData?.lastName ?? ""}`.trim();
        const sName = `${sportifData?.firstName ?? ""} ${sportifData?.lastName ?? ""}`.trim();
        setSportifName(sName);

        const id = await ensureConversation(coachId, sportifId, coachName, sName);
        setConversationId(id);
      } catch {
        // Lecture refusée : rien à afficher, l'écran reste vide plutôt que de planter.
      }
    })();
  }, [sportifId]);

  if (!conversationId || !auth.currentUser) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <ChatThread
      conversationId={conversationId}
      currentUserId={auth.currentUser.uid}
      currentUserRole="coach"
      otherName={sportifName}
    />
  );
}
