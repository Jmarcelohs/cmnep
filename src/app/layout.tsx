import type { Metadata, Viewport } from "next";
import { AppleSplashLinks } from "./apple-splash-links";
import "./globals.css";

export const metadata: Metadata = {
  title: "Câmara Municipal de Nepomuceno",
  description: "Sistema institucional da Câmara Municipal de Nepomuceno/MG",
  appleWebApp: {
    title: "Câmara Nepomuceno",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2c3f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <AppleSplashLinks />
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
