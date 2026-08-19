import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";

import MessageToast from "../../components/message-toast";
import { Colors } from "../../constants/colors";
import { useUnreadConversations } from "../../hooks/use-unread-conversations";

export default function CoachTabsLayout() {
  const { unreadCount, newMessageEvent } = useUnreadConversations("coach");

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.background },
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.55)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.navBackground,
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
      <Tabs.Screen name="sportif/[id]" options={{ href: null }} />
      <Tabs.Screen name="referentiels" options={{ href: null }} />
      <Tabs.Screen name="programme/[id]" options={{ href: null }} />
      <Tabs.Screen name="messages/[sportifId]" options={{ href: null }} />
      <Tabs.Screen name="profil-pro" options={{ href: null }} />
    </Tabs>
    <MessageToast
      event={newMessageEvent}
      onPress={(sportifId) => router.push(`/coach/messages/${sportifId}`)}
    />
    </>
  );
}
