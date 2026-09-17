import type { ReactNode } from "react";

export const metadata = {
  title: "Neva Energy — Suivi chantier",
};

export const viewport = {
  themeColor: "#0c2551",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
