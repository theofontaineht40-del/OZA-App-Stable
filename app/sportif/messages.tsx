import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import ChatThread from "../../components/chat-thread";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { ensureConversation } from "../../services/messages";

export default function SportifMessagesScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState("");
  const [hasCoach, setHasCoach] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);

      const [userSnap] = await Promise.all([getDoc(doc(db, "users", user.uid))]);
      const data = userSnap.data();
      const coachId = data?.coachId ?? null;

      if (!coachId) {
        setHasCoach(false);
        setLoading(false);
        return;
      }

      const coachSnap = await getDoc(doc(db, "users", coachId));
      const coachData = coachSnap.data();
      const cName = `${coachData?.firstName ?? ""} ${coachData?.lastName ?? ""}`.trim();
      const sName = `${data?.firstName ?? ""} ${data?.lastName ?? ""}`.trim();
      setCoachName(cName);

      const id = await ensureConversation(coachId, user.uid, cName, sName);
      setConversationId(id);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <View style={styles.container} />;
  }

  if (!hasCoach) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredEmpty}>
          <Ionicons name="person-add-outline" size={40} color={Colors.grayMedium} />
          <Text style={styles.emptyTitle}>Aucun coach associé</Text>
          <Text style={styles.emptyText}>
            Renseignez le code de votre coach dans votre profil pour lui écrire.
          </Text>
        </View>
      </View>
    );
  }

  if (!conversationId || !uid) {
    return <View style={styles.container} />;
  }

  return (
    <ChatThread
      conversationId={conversationId}
      currentUserId={uid}
      currentUserRole="sportif"
      otherName={coachName}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  centeredEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
