import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

// Personnalise le document HTML racine généré par l'export web. Sans ce
// fichier, Expo ne pose qu'une favicon classique : iOS n'a alors aucune
// icône dédiée pour "Ajouter à l'écran d'accueil" et affiche un carré
// générique à la place.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="OZA" />
        {/* Évite un flash de couleur sous l'encoche/l'heure (safe-area iOS,
            zone de rebond du scroll) avant l'hydratation, en attendant que
            le fond crème réel de l'app prenne le relais. */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#F6F4EE" />
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            // Une `height` fixe sur #root (plutôt que `min-height`) cassait
            // le scroll sur les écrans dont le contenu dépasse un écran
            // (body a `overflow:hidden` dans le reset Expo juste en dessous
            // : avec une hauteur figée, tout ce qui débordait devenait
            // inatteignable). `min-height` suffit à éviter le fond crème
            // brut en dessous du contenu sans jamais contraindre la hauteur
            // réelle vers le bas.
            __html: `html, body, #root { background-color: #F6F4EE; min-height: 100vh; min-height: 100dvh; }`,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
