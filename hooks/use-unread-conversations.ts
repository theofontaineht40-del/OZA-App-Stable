import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import { auth } from "../firebase";
import {
  Conversation,
  subscribeToConversationsForCoach,
  subscribeToConversationsForSportif,
} from "../services/messages";

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export type NewMessageEvent = {
  key: number;
  name: string;
  text: string;
  otherId: string;
};

type Role = "coach" | "sportif";

// Pas de push (pas d'infra Cloud Functions/VAPID côté serveur) : on détecte les
// nouveaux messages en comparant chaque snapshot Firestore au précédent, pour
// une notif "tant que l'app est ouverte" (badge + toast), pas hors-app.
export function useUnreadConversations(role: Role) {
  const [uid, setUid] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessageEvent, setNewMessageEvent] = useState<NewMessageEvent | null>(null);
  const knownRef = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      knownRef.current = null;
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) {
      setUnreadCount(0);
      return;
    }

    const handle = (list: Conversation[]) => {
      const unreadKey: keyof Conversation = role === "coach" ? "unreadByCoach" : "unreadBySportif";
      const otherIdKey: keyof Conversation = role === "coach" ? "sportifId" : "coachId";
      const otherNameKey: keyof Conversation = role === "coach" ? "sportifName" : "coachName";

      setUnreadCount(list.filter((c) => c[unreadKey]).length);

      const previous = knownRef.current;
      const next = new Map<string, number>();
      for (const conv of list) {
        const millis = toMillis(conv.lastMessageAt);
        next.set(conv.id, millis);

        if (
          previous &&
          conv[unreadKey] &&
          conv.lastMessageSenderId !== uid &&
          millis > (previous.get(conv.id) ?? 0)
        ) {
          setNewMessageEvent({
            key: Date.now(),
            name: String(conv[otherNameKey] ?? ""),
            text: conv.lastMessageText,
            otherId: String(conv[otherIdKey]),
          });
        }
      }
      knownRef.current = next;
    };

    const unsubscribe =
      role === "coach"
        ? subscribeToConversationsForCoach(uid, handle)
        : subscribeToConversationsForSportif(uid, handle);

    return unsubscribe;
  }, [uid, role]);

  return { unreadCount, newMessageEvent };
}
