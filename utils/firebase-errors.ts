// Firebase Auth renvoie des erreurs façon "Firebase: Error (auth/xxx-yyy)."
// — techniquement correct, mais jamais quelque chose à montrer tel quel à
// un sportif ou un coach. On traduit les codes les plus courants ; tout
// code inconnu retombe sur un message générique plutôt que la string brute.
const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use":
    "Cet email est déjà utilisé par un autre compte. Connectez-vous, ou utilisez une autre adresse.",
  "auth/invalid-email": "Cette adresse email n'est pas valide.",
  "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
  "auth/user-not-found": "Aucun compte ne correspond à cet email.",
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/invalid-credential": "Email ou mot de passe incorrect.",
  "auth/too-many-requests": "Trop de tentatives — réessayez dans quelques minutes.",
  "auth/network-request-failed": "Connexion internet impossible. Vérifiez votre réseau et réessayez.",
  "auth/user-disabled": "Ce compte a été désactivé.",
};

function extractCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && typeof (error as any).code === "string") {
    return (error as any).code;
  }
  if (error instanceof Error) {
    const match = error.message.match(/\(([^)]+)\)/);
    if (match) return match[1];
  }
  return null;
}

export function friendlyAuthError(error: unknown): string {
  const code = extractCode(error);
  if (code && MESSAGES[code]) return MESSAGES[code];
  return "Une erreur est survenue. Réessayez dans quelques instants.";
}
