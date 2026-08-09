import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Câmara Municipal de Nepomuceno",
    short_name: "Câmara Nepomuceno",
    description: "Sistema institucional da Câmara Municipal de Nepomuceno/MG",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2c3f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Atalhos no menu de segurar o ícone (Android/Chrome só — iOS Safari
    // ainda não suporta). Só os 3 formulários de criação mais usados.
    shortcuts: [
      {
        name: "Nova Diária",
        url: "/diarias/nova",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Novo Ofício",
        url: "/oficios/novo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Novo Reembolso",
        url: "/requerimentos/novo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
