import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ChatIllustration } from "../../../components/empty-illustrations";
import { Colors } from "../../../constants/colors";
import { auth } from "../../../firebase";
import { Conversation, subscribeToConversationsForSportif } from "../../../services/messages";
import { getRelationsForSportif, Relation } from "../../../services/relations";

type Row = {
  coachId: string;
  name: string;
  badge: string | null;
  conversation: Conversation | null;
};

export default function SportifMessagesListScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      try {
        const data = await getRelationsForSportif(user.uid);
        setRelations(data);
      } catch {
        setRelations([]);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToConversationsForSportif(uid, setConversations);
    return unsubscribe;
  }, [uid]);

  if (loading) {
    return <View style={styles.container} />;
  }

  // L'équipe (principal + intervenants) apparaît toujours ; un coach
  // simplement contacté depuis Découvrir sans être ajouté à l'équipe
  // apparaît aussi, via sa conversation.
  const rows: Row[] = relations.map((r) => ({
    coachId: r.coachId,
    name: `${r.coachFirstName} ${r.coachLastName}`.trim(),
    badge: r.type === "principal" ? "Coach principal" : r.specialite,
    conversation: conversations.find((c) => c.coachId === r.coachId) ?? null,
  }));

  for (const conv of conversations) {
    if (!rows.some((row) => row.coachId === conv.coachId)) {
      rows.push({ coachId: conv.coachId, name: conv.coachName, badge: null, conversation: conv });
    }
  }

  rows.sort((a, b) => {
    const aTime = (a.conversation?.lastMessageAt as any)?.toMillis?.() ?? 0;
    const bTime = (b.conversation?.lastMessageAt as any)?.toMillis?.() ?? 0;
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
          <ChatIllustration size={80} />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyText}>
            Trouvez un coach dans Découvrir pour lui écrire, même sans l'avoir encore ajouté.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/sportif/decouvrir")}>
            <Text style={styles.emptyButtonText}>Découvrir des coachs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        rows.map((row) => (
          <TouchableOpacity
            key={row.coachId}
            style={styles.row}
            onPress={() => router.push(`/sportif/messages/${row.coachId}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {row.name
                  .split(" ")
                  .map((part) => part[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{row.name}</Text>
                {row.conversation?.unreadBySportif && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>Non lu</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.preview, row.conversation?.unreadBySportif && styles.previewUnread]}
                numberOfLines={1}
              >
                {row.conversation?.lastMessageText || row.badge || "Aucun message"}
              </Text>
            </View>
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

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  previewUnread: {
    color: Colors.text,
    fontWeight: "600",
  },

  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  unreadBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
