import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Lavilli Jet | Gestão do Hangar",
  description: "Controle operacional interno de hangar",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon-gold.svg", type: "image/svg+xml", sizes: "any" },
    ],
  },
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('lavilli-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
