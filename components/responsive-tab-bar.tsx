import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useWindowDimensions } from "react-native";

import CustomBottomTabBar from "./bottom-tab-bar";
import SideTabBar from "./side-tab-bar";

// Largeur à partir de laquelle on passe en barre latérale (ordinateur).
export const SIDEBAR_MIN_WIDTH = 1100;

export function useUseSidebar(): boolean {
  return useWindowDimensions().width >= SIDEBAR_MIN_WIDTH;
}

// Barre latérale sur grand écran, barre du bas ailleurs. À utiliser avec
// `tabBarPosition: useUseSidebar() ? "left" : "bottom"` dans screenOptions :
// c'est cette option qui place la barre à gauche du contenu.
export default function ResponsiveTabBar(props: BottomTabBarProps & { roleLabel: string }) {
  return useUseSidebar() ? <SideTabBar {...props} /> : <CustomBottomTabBar {...props} />;
}
