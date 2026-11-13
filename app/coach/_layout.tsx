import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";

import ResponsiveTabBar, { useUseSidebar } from "../../components/responsive-tab-bar";
import MessageToast from "../../components/message-toast";
import { Colors } from "../../constants/colors";
import { useUnreadConversations } from "../../hooks/use-unread-conversations";

export default function CoachTabsLayout() {
  const { unreadCount, newMessageEvent } = useUnreadConversations("coach");
  const sidebar = useUseSidebar();

  return (
    <>
    <Tabs
      tabBar={(props) => <ResponsiveTabBar {...props} roleLabel="Coach" />}
      screenOptions={{
        tabBarPosition: sidebar ? "left" : "bottom",
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.background },
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
        name="sportifs"
        options={{
          title: "Sportifs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
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
      <Tabs.Screen name="analyse" options={{ href: null }} />
      <Tabs.Screen name="nouvelle-seance" options={{ href: null }} />
      <Tabs.Screen name="import-julie" options={{ href: null }} />
      <Tabs.Screen name="fix-julie" options={{ href: null }} />
      <Tabs.Screen name="referentiels" options={{ href: null }} />
      <Tabs.Screen name="programme/[id]" options={{ href: null }} />
      <Tabs.Screen name="messages/[sportifId]" options={{ href: null }} />
      <Tabs.Screen name="profil-pro" options={{ href: null }} />
      <Tabs.Screen name="generateur" options={{ href: null }} />
    </Tabs>
    <MessageToast
      event={newMessageEvent}
      onPress={(sportifId) => router.push(`/coach/messages/${sportifId}`)}
    />
    </>
  );
}
