import { usePathname } from "expo-router";

// Chemin de base des écrans OZA Programs selon l'espace où l'on est : les
// mêmes écrans servent au sportif et au coach, chacun dans sa propre barre de
// navigation.
export function useOzaBase(): "/sportif/oza" | "/coach/oza" {
  const pathname = usePathname();
  return pathname.startsWith("/coach") ? "/coach/oza" : "/sportif/oza";
}

export function useIsCoachSpace(): boolean {
  return usePathname().startsWith("/coach");
}
