import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";

// Remplace le BottomTabBar par défaut de @react-navigation/bottom-tabs.
// Celui-ci enveloppe son style dans un Animated.View avec en permanence un
// `transform: [{ translateY }]` (même au repos, pour l'animation
// show/hide) — hors, un `transform` sur un élément `position: fixed` crée
// un nouveau bloc de référence pour LUI-MÊME sur certaines versions de
// WebKit (iOS Safari), le faisant alors se positionner par rapport à un
// ancêtre transformé plutôt que le vrai viewport. Ce composant est un
// simple <View> sans aucune animation ni transform : le `position: fixed`
// qu'on lui applique reste donc fiable sur tous les navigateurs.
export default function CustomBottomTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const bottomInset = Math.min(insets.bottom, 34);

  return (
    <View
      style={[
        styles.bar,
        {
          height: 82 + bottomInset,
          paddingBottom: 24 + bottomInset,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const { options } = descriptor;
        if (
          options.tabBarItemStyle &&
          (options.tabBarItemStyle as { display?: string }).display === "none"
        ) {
          return null;
        }

        const focused = state.index === index;
        const label = options.title ?? route.name;
        const color = focused ? Colors.primaryLight : "rgba(255, 255, 255, 0.55)";

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
          <Pressable key={route.key} style={styles.item} onPress={onPress}>
            {options.tabBarIcon?.({ focused, color, size: 24 })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    ...(Platform.OS === "web" ? { position: "fixed" as any } : { position: "absolute" }),
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.navBackground,
  },

  item: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
  },

  badge: {
    position: "absolute",
    top: 2,
    right: "28%",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },

  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
