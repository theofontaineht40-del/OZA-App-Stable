import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";

import MessageToast from "../../components/message-toast";
import { Colors } from "../../constants/colors";
import { useUnreadConversations } from "../../hooks/use-unread-conversations";

export default function SportifTabsLayout() {
  const { unreadCount, newMessageEvent } = useUnreadConversations("sportif");

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: Colors.grayMedium,
          backgroundColor: Colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="decouvrir"
        options={{
          title: "Découvrir",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Réservations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="programmes"
        options={{
          title: "Programmes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          title: "Messages",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="nouvelle-seance" options={{ href: null }} />
      <Tabs.Screen name="historique" options={{ href: null }} />
      <Tabs.Screen name="programme/[id]" options={{ href: null }} />
      <Tabs.Screen name="equipe" options={{ href: null }} />
      <Tabs.Screen name="messages/[coachId]" options={{ href: null }} />
    </Tabs>
    <MessageToast
      event={newMessageEvent}
      onPress={(coachId) => router.push(`/sportif/messages/${coachId}`)}
    />
    </>
  );
}
