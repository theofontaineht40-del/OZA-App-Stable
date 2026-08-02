import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "../firebase";
import { getRelation } from "../services/relations";

// true = coach principal (accès complet), false = pas principal (accès refusé),
// null = vérification en cours.
export function usePrincipalAccess(sportifId: string | undefined): boolean | null {
  const [isPrincipal, setIsPrincipal] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sportifId) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsPrincipal(false);
        return;
      }
      const relation = await getRelation(sportifId, user.uid);
      setIsPrincipal(relation?.type === "principal");
    });

    return unsubscribe;
  }, [sportifId]);

  return isPrincipal;
}
