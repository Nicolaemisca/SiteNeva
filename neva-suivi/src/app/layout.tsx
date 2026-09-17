import type { ReactNode } from "react";

export const metadata = {
  title: "Neva Energy — Suivi chantier",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
