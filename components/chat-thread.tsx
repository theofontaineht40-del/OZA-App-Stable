import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../constants/colors";
import {
  ChatMessage,
  markConversationRead,
  SenderRole,
  sendMessage,
  subscribeToMessages,
  uploadChatPhoto,
} from "../services/messages";

type Props = {
  conversationId: string;
  currentUserId: string;
  currentUserRole: SenderRole;
  otherName: string;
};

function formatTime(value: unknown): string {
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return "";
}

export default function ChatThread({ conversationId, currentUserId, currentUserRole, otherName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, setMessages);
    markConversationRead(conversationId, currentUserRole);
    return unsubscribe;
  }, [conversationId, currentUserRole]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function handleSendText() {
    if (!text.trim() || sending) return;
    const value = text.trim();
    setText("");
    setSending(true);
    try {
      await sendMessage(conversationId, currentUserId, currentUserRole, value, null);
    } finally {
      setSending(false);
    }
  }

  async function handleSendPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (result.canceled) return;
    setSending(true);
    try {
      const url = await uploadChatPhoto(conversationId, result.assets[0].uri);
      await sendMessage(conversationId, currentUserId, currentUserRole, "", url);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherName}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color={Colors.grayMedium} />
            <Text style={styles.emptyText}>Aucun message pour l'instant. Dites bonjour !</Text>
          </View>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return (
              <View
                key={m.id}
                style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}
              >
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  {m.photoUrl && <Image source={{ uri: m.photoUrl }} style={styles.bubblePhoto} />}
                  {!!m.text && (
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{m.text}</Text>
                  )}
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                    {formatTime(m.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TouchableOpacity onPress={handleSendPhoto} disabled={sending} style={styles.attachButton}>
          <Ionicons name="camera-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          onPress={handleSendText}
          disabled={!text.trim() || sending}
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  messages: {
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingTop: 80,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  bubbleRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  bubbleRowMine: {
    justifyContent: "flex-end",
  },

  bubbleRowOther: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },

  bubbleOther: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  bubblePhoto: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 6,
  },

  bubbleText: {
    fontSize: 14,
    color: Colors.text,
  },

  bubbleTextMine: {
    color: Colors.white,
  },

  bubbleTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    alignSelf: "flex-end",
  },

  bubbleTimeMine: {
    color: "#FFE3EE",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grayMedium,
    backgroundColor: Colors.white,
  },

  attachButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: Colors.grayLight,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },

  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  sendButtonDisabled: {
    backgroundColor: Colors.grayMedium,
  },
});
