import "./globals.css";

export const metadata = {
  title: "DIVA 2.0 — Entretien diagnostique TDAH adulte",
  description: "Outil interactif d'aide à la passation de la DIVA 2.0 pour le TDAH chez l'adulte (Kooij & Francken, 2010).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
