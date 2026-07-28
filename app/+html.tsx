import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const serviceWorkerBootstrap = `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The application remains usable online if a browser does not support service workers.
    });
  });
}
`;

/**
 * Web-only document shell for the statically exported Expo Router site.
 * It adds install metadata and safely registers the lightweight offline cache.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#087A55" />
        <meta name="description" content="Rubber ระบบบันทึกการขายยางพารา" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rubber" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/rubber-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerBootstrap }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
