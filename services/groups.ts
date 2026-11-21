import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { ChatMessage, SenderRole } from "./messages";

// Messagerie de groupe : le coach crée un groupe avec ses sportifs ; tous les
// membres (et le coach) écrivent dans un même fil. Collection `groups`, messages
// en sous-collection (même format que les conversations individuelles).

export type Group = {
  id: string;
  coachId: string;
  name: string;
  memberIds: string[];
  // uid → nom affiché (coach compris), pour afficher qui écrit.
  memberNames: Record<string, string>;
  lastMessageText: string;
  lastMessageAt: unknown;
  lastMessageSenderId: string | null;
  lastSenderName: string;
  // Participants qui n'ont pas encore lu le dernier message.
  unreadFor: string[];
};

function toGroup(id: string, d: Record<string, any>): Group {
  return {
    id,
    coachId: d.coachId,
    name: d.name ?? "",
    memberIds: d.memberIds ?? [],
    memberNames: d.memberNames ?? {},
    lastMessageText: d.lastMessageText ?? "",
    lastMessageAt: d.lastMessageAt ?? null,
    lastMessageSenderId: d.lastMessageSenderId ?? null,
    lastSenderName: d.lastSenderName ?? "",
    unreadFor: d.unreadFor ?? [],
  };
}

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export async function createGroup(
  coach: { uid: string; name: string },
  name: string,
  members: { uid: string; name: string }[]
): Promise<string> {
  const memberNames: Record<string, string> = { [coach.uid]: coach.name };
  for (const m of members) memberNames[m.uid] = m.name;
  const ref = await addDoc(collection(db, "groups"), {
    coachId: coach.uid,
    name: name.trim(),
    memberIds: members.map((m) => m.uid),
    memberNames,
    lastMessageText: "",
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: null,
    lastSenderName: "",
    unreadFor: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getGroup(groupId: string): Promise<Group | null> {
  try {
    const snap = await getDoc(doc(db, "groups", groupId));
    return snap.exists() ? toGroup(snap.id, snap.data()) : null;
  } catch {
    return null; // supprimé ou accès refusé
  }
}

// Le coach voit les groupes qu'il a créés, le sportif ceux dont il est membre.
export function subscribeToGroups(
  uid: string,
  role: SenderRole,
  callback: (groups: Group[]) => void
): () => void {
  const q =
    role === "coach"
      ? query(collection(db, "groups"), where("coachId", "==", uid))
      : query(collection(db, "groups"), where("memberIds", "array-contains", uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => toGroup(d.id, d.data()));
      list.sort((a, b) => toMillis(b.lastMessageAt) - toMillis(a.lastMessageAt));
      callback(list);
    },
    () => callback([])
  );
}

export function subscribeToGroupMessages(groupId: string, callback: (messages: ChatMessage[]) => void): () => void {
  const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) =>
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            senderId: data.senderId,
            senderRole: data.senderRole,
            senderName: data.senderName ?? "",
            text: data.text,
            photoUrl: data.photoUrl ?? null,
            programmeId: null,
            programmeNom: null,
            createdAt: data.createdAt,
          };
        })
      ),
    () => callback([])
  );
}

export async function sendGroupMessage(
  group: Group,
  sender: { uid: string; role: SenderRole; name: string },
  text: string,
  photoUrl: string | null
): Promise<void> {
  await addDoc(collection(db, "groups", group.id, "messages"), {
    senderId: sender.uid,
    senderRole: sender.role,
    senderName: sender.name,
    text,
    photoUrl,
    createdAt: serverTimestamp(),
  });
  const participants = [group.coachId, ...group.memberIds];
  await updateDoc(doc(db, "groups", group.id), {
    lastMessageText: text || (photoUrl ? "📷 Photo" : ""),
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: sender.uid,
    lastSenderName: sender.name,
    unreadFor: participants.filter((p) => p !== sender.uid),
  });
}

export async function markGroupRead(groupId: string, uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, "groups", groupId), { unreadFor: arrayRemove(uid) });
  } catch {
    // groupe supprimé : rien à marquer
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, "groups", groupId));
}
