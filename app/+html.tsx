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
        {/* Direction premium dark : sans ça, la bande sous l'encoche/l'heure
            (safe-area iOS, zone de rebond du scroll) reste blanche par
            défaut alors que tout le reste de l'appli est passé en noir. */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#080808" />
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `html, body { background-color: #080808; }`,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
