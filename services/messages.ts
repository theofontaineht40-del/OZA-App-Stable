import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";

import { db, storage } from "../firebase";

export type SenderRole = "coach" | "sportif";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  text: string;
  photoUrl: string | null;
  createdAt: unknown;
};

export type Conversation = {
  id: string;
  coachId: string;
  sportifId: string;
  coachName: string;
  sportifName: string;
  lastMessageText: string;
  lastMessageAt: unknown;
  lastMessageSenderId: string | null;
  unreadByCoach: boolean;
  unreadBySportif: boolean;
};

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function getConversationId(coachId: string, sportifId: string): string {
  return `${coachId}_${sportifId}`;
}

export async function ensureConversation(
  coachId: string,
  sportifId: string,
  coachName: string,
  sportifName: string
): Promise<string> {
  const id = getConversationId(coachId, sportifId);
  const ref = doc(db, "conversations", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      coachId,
      sportifId,
      coachName,
      sportifName,
      lastMessageText: "",
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: null,
      unreadByCoach: false,
      unreadBySportif: false,
    });
  }
  return id;
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })));
    },
    () => {
      // Lecture refusée (conversation pas encore accessible) : pas de crash, liste vide.
      callback([]);
    }
  );
}

export function subscribeToConversationsForCoach(
  coachId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const q = query(collection(db, "conversations"), where("coachId", "==", coachId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Conversation, "id">) }));
      list.sort((a, b) => toMillis(b.lastMessageAt) - toMillis(a.lastMessageAt));
      callback(list);
    },
    () => {
      callback([]);
    }
  );
}

export function subscribeToConversationsForSportif(
  sportifId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const q = query(collection(db, "conversations"), where("sportifId", "==", sportifId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Conversation, "id">) }));
      list.sort((a, b) => toMillis(b.lastMessageAt) - toMillis(a.lastMessageAt));
      callback(list);
    },
    () => {
      callback([]);
    }
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderRole: SenderRole,
  text: string,
  photoUrl: string | null
): Promise<void> {
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    senderId,
    senderRole,
    text,
    photoUrl,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessageText: text || (photoUrl ? "📷 Photo" : ""),
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
    unreadByCoach: senderRole === "sportif",
    unreadBySportif: senderRole === "coach",
  });
}

export async function markConversationRead(conversationId: string, role: SenderRole): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), {
    [role === "coach" ? "unreadByCoach" : "unreadBySportif"]: false,
  });
}

export async function uploadChatPhoto(conversationId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileRef = storageRef(storage, `chat/${conversationId}/${Date.now()}.jpg`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}
