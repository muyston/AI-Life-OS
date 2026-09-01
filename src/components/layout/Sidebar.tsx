"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  Bot, 
  Inbox,
  Activity,
  ShieldCheck,
  Settings
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Vista Diaria", href: "/", icon: LayoutDashboard },
    { name: "Smart Inbox", href: "/ideas", icon: Inbox },
    { name: "Proyectos", href: "/projects", icon: FolderKanban },
    { name: "Tareas", href: "/tasks", icon: CheckSquare },
    { name: "Calendario", href: "/calendar", icon: Calendar },
    { name: "Panel de Agentes", href: "/agents", icon: Bot },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-surface-900 border-r border-surface-800 flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-surface-800 border border-surface-700 flex items-center justify-center text-brand-500 font-semibold text-sm">
              OS
            </div>
            <div>
              <span className="font-semibold tracking-tight text-surface-50 text-sm block">
                AI Life OS
              </span>
              <span className="text-[11px] text-surface-400 block font-mono">
                v0.1.0 Institutional
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
            Modulos Principales
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-surface-800 text-white border border-surface-700/80 shadow-sm"
                    : "text-surface-400 hover:text-surface-100 hover:bg-surface-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-accent-500" : "text-surface-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-surface-800 space-y-3">
        <div className="bg-surface-950/80 border border-surface-800/80 rounded p-3 text-xs">
          <div className="flex items-center justify-between text-surface-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand-500" />
              Estado del Sistema
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-brand-500"></span>
          </div>
          <p className="text-[11px] text-surface-400 font-mono">
            Orquestador: Activo
          </p>
          <p className="text-[11px] text-surface-400 font-mono">
            Planificador: Listo
          </p>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-surface-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-surface-400" />
            Local-first SQLite
          </span>
          <span className="font-mono">Fase 1</span>
        </div>
      </div>
    </aside>
  );
}
