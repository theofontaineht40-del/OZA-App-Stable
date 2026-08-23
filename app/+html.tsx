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
        {/* La barre de navigation du bas est teal foncé sur tous les écrans
            connectés ; le fond brut html/body/#root (visible dans les
            écarts d'arrondi sous-pixel ou de zone de sécurité iOS que le
            navigateur laisse parfois apparaître) doit donc être teal foncé
            lui aussi plutôt que la couleur crème par défaut de l'app, pour
            que tout écart résiduel soit invisible au lieu d'être une bande
            blanche. `min-height` (jamais `height`) : une hauteur figée sur
            #root casse le scroll dès qu'un écran dépasse une page (body a
            `overflow:hidden` dans le reset Expo juste en dessous). */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0C2E2D" />
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { margin: 0; padding: 0; background-color: #0C2E2D; min-height: 100vh; min-height: 100dvh; }
              /* En mode "ajouté à l'écran d'accueil" (standalone), 100dvh
                 sur #root ne couvre pas toujours la zone de sécurité tout en
                 bas (home indicator) sur iOS — ce qui laissait apparaître le
                 noir par défaut du système sous la barre du bas au lieu du
                 teal de l'app. On réserve explicitement cette hauteur sur
                 body, qui a déjà le même fond teal, pour la peindre à coup sûr. */
              body { padding-bottom: env(safe-area-inset-bottom, 0px); }
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
