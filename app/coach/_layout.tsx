import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { Colors } from "../../constants/colors";

export default function CoachTabsLayout() {
  return (
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
          backgroundColor: Colors.white,
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
      <Tabs.Screen name="sportif/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/profil-medical" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/hygiene-vie" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/morphologie" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/posture" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/mobilite" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/tests-physiques" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/task-analysis" options={{ href: null }} />
      <Tabs.Screen name="referentiels" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/planification" options={{ href: null }} />
      <Tabs.Screen name="sportif/[id]/nouvelle-seance" options={{ href: null }} />
      <Tabs.Screen name="programme/[id]" options={{ href: null }} />
      <Tabs.Screen name="messages/[sportifId]" options={{ href: null }} />
      <Tabs.Screen name="profil-pro" options={{ href: null }} />
    </Tabs>
  );
}
