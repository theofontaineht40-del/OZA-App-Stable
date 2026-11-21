import { useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import ChatThread from "./chat-thread";
import { Colors } from "../constants/colors";
import { auth, db } from "../firebase";
import { Group, getGroup } from "../services/groups";

// Fil de discussion d'un groupe, pour le coach comme pour le sportif.
export default function GroupThreadScreen({ role }: { role: "coach" | "sportif" }) {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<Group | null | undefined>(undefined);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        setUid(user?.uid ?? null);
        if (!user) return;
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.data();
        setName(`${d?.firstName ?? ""} ${d?.lastName ?? ""}`.trim());
      }),
    []
  );

  useEffect(() => {
    if (!groupId) return;
    setGroup(undefined);
    getGroup(groupId).then(setGroup);
  }, [groupId]);

  if (!uid || group === undefined) return <View style={{ flex: 1, backgroundColor: Colors.background }} />;

  if (group === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", padding: 30 }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: "center" }}>
          Ce groupe n'existe plus ou tu n'en fais plus partie.
        </Text>
      </View>
    );
  }

  return (
    <ChatThread
      key={group.id}
      conversationId={group.id}
      currentUserId={uid}
      currentUserRole={role}
      otherName={group.name}
      group={group}
      currentUserName={name}
    />
  );
}
