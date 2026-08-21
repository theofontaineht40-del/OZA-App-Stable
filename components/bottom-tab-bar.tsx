import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";

// Remplace le BottomTabBar par défaut de @react-navigation/bottom-tabs.
// Volontairement PAS en `position: fixed`/`absolute` : sur certains
// iPhone/Safari, un `fixed` (même sans transform concurrent) laissait un
// vide résiduel entre la barre et le vrai bord de l'écran — un bug
// impossible à reproduire en local. En flux normal (dernier enfant d'une
// colonne flex dont le conteneur des écrans est en `flex: 1`), la barre se
// retrouve mécaniquement collée à la fin du conteneur réel, sans dépendre
// du positionnement `fixed` par rapport au viewport.
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
