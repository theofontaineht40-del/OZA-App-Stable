import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TeamIllustration } from "../../../components/empty-illustrations";
import { Colors } from "../../../constants/colors";
import { auth } from "../../../firebase";
import { Conversation, subscribeToConversationsForCoach } from "../../../services/messages";
import { getMySportifs, SportifSummary } from "../../../services/tracking";

export default function MessagesListScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [sportifs, setSportifs] = useState<SportifSummary[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      const data = await getMySportifs(user.uid);
      setSportifs(data);
      setLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToConversationsForCoach(uid, setConversations);
    return unsubscribe;
  }, [uid]);

  if (loading) {
    return <View style={styles.container} />;
  }

  const rows = sportifs
    .map((s) => {
      const conv = conversations.find((c) => c.sportifId === s.uid);
      return { sportif: s, conversation: conv ?? null };
    })
    .sort((a, b) => {
      const aTime = a.conversation ? (a.conversation.lastMessageAt as any)?.toMillis?.() ?? 0 : 0;
      const bTime = b.conversation ? (b.conversation.lastMessageAt as any)?.toMillis?.() ?? 0 : 0;
      return bTime - aTime;
    });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Messagerie</Text>

      {rows.length === 0 ? (
        <View style={styles.emptyCard}>
          <TeamIllustration size={80} />
          <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
          <Text style={styles.emptyText}>
            Partagez votre code coach pour associer des sportifs et pouvoir leur écrire.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/coach/profil")}>
            <Text style={styles.emptyButtonText}>Voir mon code coach</Text>
          </TouchableOpacity>
        </View>
      ) : (
        rows.map(({ sportif, conversation }) => (
          <TouchableOpacity
            key={sportif.uid}
            style={styles.row}
            onPress={() => router.push(`/coach/messages/${sportif.uid}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {`${sportif.firstName?.[0] ?? ""}${sportif.lastName?.[0] ?? ""}`.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {sportif.firstName} {sportif.lastName}
              </Text>
              <Text style={styles.preview} numberOfLines={1}>
                {conversation?.lastMessageText || "Aucun message"}
              </Text>
            </View>
            {conversation?.unreadByCoach && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 20,
  },

  emptyCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: "center",
    gap: 6,
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
    paddingHorizontal: 20,
  },

  emptyButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  emptyButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  preview: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
});
