import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";
import { auth, db } from "../firebase";

// Barre de navigation latérale pour les grands écrans (ordinateur) : même
// contenu que la barre du bas (mêmes onglets, même badge de messages), mais
// en colonne à gauche avec le nom OZA en haut et le nom + rôle de l'utilisateur
// en bas. Les écrans étroits (téléphone, tablette) gardent la barre du bas —
// voir ResponsiveTabBar.
export default function SideTabBar({
  state,
  descriptors,
  navigation,
  roleLabel,
}: BottomTabBarProps & { roleLabel: string }) {
  const [name, setName] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setName(`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim());
        }
      } catch {
        // Nom illisible : on affiche seulement le rôle.
      }
    });
  }, []);

  return (
    <View style={styles.bar}>
      <View style={styles.logoRow}>
        <Text style={styles.brand}>OZA</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.items}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if (
            options.tabBarItemStyle &&
            (options.tabBarItemStyle as { display?: string }).display === "none"
          ) {
            return null;
          }

          const focused = state.index === index;
          const label = options.title ?? route.name;
          const color = focused ? Colors.white : "rgba(255, 255, 255, 0.65)";

          function onPress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              style={[styles.item, focused && styles.itemActive]}
              onPress={onPress}
            >
              {options.tabBarIcon?.({ focused, color, size: 20 })}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
              {!!options.tabBarBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.user}>
        {!!name && <Text style={styles.userName} numberOfLines={1}>{name}</Text>}
        <Text style={styles.userRole}>{roleLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: 240,
    backgroundColor: Colors.navBackground,
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  brand: { fontSize: 26, fontWeight: "800", letterSpacing: 3, color: Colors.white },
  items: { gap: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemActive: { backgroundColor: "rgba(255, 255, 255, 0.12)" },
  label: { flex: 1, fontSize: 14, fontWeight: "600" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  user: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 14,
    paddingHorizontal: 8,
  },
  userName: { fontSize: 14, fontWeight: "700", color: Colors.white },
  userRole: { fontSize: 12, color: "rgba(255, 255, 255, 0.6)", marginTop: 2 },
});
