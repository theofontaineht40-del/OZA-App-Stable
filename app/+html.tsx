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
            // `100vh` ne suit pas la barre d'outils rétractable de Safari
            // iOS : au scroll, elle se rétracte, révèle de la hauteur en
            // plus, et ce fond crème brut apparaissait en bas le temps que
            // le fond de l'app (peint via une hauteur figée) le rattrape.
            // `100dvh` (dynamic viewport height) suit ces variations. Une
            // vraie `height` (pas juste `min-height`) est nécessaire pour
            // que #root, qui hérite en `height:100%` (reset Expo juste en
            // dessous), ait une base de calcul non ambiguë — sinon un écart
            // d'arrondi sous-pixel apparaît/disparaît selon le niveau de
            // zoom, un symptôme observé sur iOS.
            __html: `html, body, #root { background-color: #F6F4EE; height: 100vh; height: 100dvh; min-height: 100vh; min-height: 100dvh; }`,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
