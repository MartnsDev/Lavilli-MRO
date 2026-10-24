import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lavilli Jet | Gestão do Hangar",
    short_name: "Lavilli Jet",
    lang: "pt-BR",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0d213c",
    theme_color: "#0d213c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
