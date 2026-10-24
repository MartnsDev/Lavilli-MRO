import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Lavilli Jet | Gestão do Hangar",
  description: "Controle operacional interno de hangar",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('lavilli-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
