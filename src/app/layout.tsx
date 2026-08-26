import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Life OS - Sistema Operativo Personal",
  description: "Sistema operativo personal con agentes de IA y memoria estructurada.",
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
        <main className="flex-1 flex flex-col min-w-0 bg-surface-950 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
