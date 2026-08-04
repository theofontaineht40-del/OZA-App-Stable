import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { getProgrammesForCoach, Programme } from "../services/programmes";

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
  const [programmePickerVisible, setProgrammePickerVisible] = useState(false);
  const [programmes, setProgrammes] = useState<Programme[] | null>(null);
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

  async function handleOpenProgrammePicker() {
    setProgrammePickerVisible(true);
    if (programmes === null) {
      const data = await getProgrammesForCoach(currentUserId);
      setProgrammes(data);
    }
  }

  async function handleSendProgramme(programme: Programme) {
    setProgrammePickerVisible(false);
    setSending(true);
    try {
      await sendMessage(conversationId, currentUserId, currentUserRole, "", null, {
        id: programme.id,
        nom: programme.nom,
      });
    } finally {
      setSending(false);
    }
  }

  function openProgramme(programmeId: string) {
    router.push(
      currentUserRole === "coach"
        ? `/coach/programme/${programmeId}`
        : `/sportif/programme/${programmeId}`
    );
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
                  {m.programmeId && (
                    <TouchableOpacity
                      style={styles.programmeCard}
                      onPress={() => openProgramme(m.programmeId as string)}
                    >
                      <View style={styles.programmeIcon}>
                        <Ionicons name="barbell" size={18} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.programmeLabel}>Programme</Text>
                        <Text style={styles.programmeName} numberOfLines={1}>
                          {m.programmeNom}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  )}
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
        {currentUserRole === "coach" && (
          <TouchableOpacity
            onPress={handleOpenProgrammePicker}
            disabled={sending}
            style={styles.attachButton}
          >
            <Ionicons name="barbell-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
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

      <Modal
        visible={programmePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProgrammePickerVisible(false)}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Envoyer un programme</Text>
              <TouchableOpacity onPress={() => setProgrammePickerVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {programmes === null ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
            ) : programmes.length === 0 ? (
              <Text style={styles.pickerEmpty}>Aucun programme créé pour l'instant.</Text>
            ) : (
              <ScrollView style={styles.pickerList}>
                {programmes.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.pickerRow}
                    onPress={() => handleSendProgramme(p)}
                  >
                    <View style={styles.programmeIcon}>
                      <Ionicons name="barbell" size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerRowName} numberOfLines={1}>
                        {p.nom}
                      </Text>
                      {!!p.sportifName && (
                        <Text style={styles.pickerRowSub}>Assigné à {p.sportifName}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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

  programmeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    minWidth: 200,
  },

  programmeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFF1F7",
    justifyContent: "center",
    alignItems: "center",
  },

  programmeLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  programmeName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  pickerCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: "70%",
  },

  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  pickerEmpty: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginVertical: 24,
  },

  pickerList: {
    maxHeight: 360,
  },

  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },

  pickerRowName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  pickerRowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
