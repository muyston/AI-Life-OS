import type { Metadata, Viewport } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { FocusModeModal } from "@/components/focus/FocusModeModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Life OS - Sistema Operativo Personal",
  description: "Sistema operativo personal y profesional con orquestación multi-agente y memoria estructurada.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life OS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-surface-950 text-surface-50 antialiased flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-surface-950">
          <HeaderNav />
          <main className="flex-1 flex flex-col min-w-0 bg-surface-950 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
        <CommandPalette />
        <FocusModeModal />
      </body>
    </html>
  );
}
