"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  Bot, 
  Inbox, 
  Flame, 
  Activity, 
  ShieldCheck,
  Radio,
  Zap,
  BookOpen
} from "lucide-react";
import { useLifeOS } from "@/lib/store/life-os-store";

export function Sidebar() {
  const pathname = usePathname();
  const { tasks, habits, events, aiActions, isSyncingCalendar } = useLifeOS();

  const pendingTasksCount = tasks.filter((t) => t.status === "PENDING").length;
  const pendingHabitsToday = habits.filter((h) => h.active && !h.isCompletedToday).length;
  const pendingActionsCount = aiActions.filter((a) => a.status === "PENDING_REVIEW").length;

  const navigation = [
    { 
      name: "Vista Diaria", 
      href: "/", 
      icon: LayoutDashboard,
      badge: null,
    },
    { 
      name: "Smart Inbox", 
      href: "/ideas", 
      icon: Inbox,
      badge: null,
    },
    { 
      name: "Habitos & Streaks", 
      href: "/habits", 
      icon: Flame,
      badge: pendingHabitsToday > 0 ? `${pendingHabitsToday} pend.` : null,
      badgeColor: "text-amber-400 bg-amber-950/60 border-amber-800/60",
    },
    { 
      name: "Tareas", 
      href: "/tasks", 
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
      badgeColor: "text-cyan-400 bg-cyan-950/60 border-cyan-800/60",
    },
    { 
      name: "Calendario", 
      href: "/calendar", 
      icon: Calendar,
      badge: events.length > 0 ? `${events.length} ev.` : null,
      badgeColor: "text-blue-400 bg-blue-950/60 border-blue-800/60",
    },
    { 
      name: "Reflexion Diaria", 
      href: "/reflection", 
      icon: BookOpen,
      badge: null,
    },
    { 
      name: "Proyectos", 
      href: "/projects", 
      icon: FolderKanban,
      badge: null,
    },
    { 
      name: "Panel de Agentes", 
      href: "/agents", 
      icon: Bot,
      badge: pendingActionsCount > 0 ? `${pendingActionsCount} rev.` : null,
      badgeColor: "text-purple-400 bg-purple-950/60 border-purple-800/60",
    },
  ];

  return (
    <aside className="hidden md:flex w-64 glass-panel border-r border-white/[0.08] flex-col justify-between shrink-0 min-h-screen z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-white/15 flex items-center justify-center text-cyan-400 font-bold text-xs shadow-inner">
              OS
            </div>
            <div>
              <span className="font-semibold tracking-tight text-surface-50 text-sm block">
                AI Life OS Pro
              </span>
              <span className="text-[10px] text-surface-400 block font-mono">
                Arquitectura de Precision
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3.5 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold text-surface-500 uppercase tracking-wider">
            Modulos del Ecosistema
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-surface-800/90 text-surface-50 border border-white/10 shadow-xs font-semibold"
                    : "text-surface-400 hover:text-surface-100 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-surface-400"}`} />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${item.badgeColor || "text-surface-400 bg-surface-900 border-white/10"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-white/[0.08] space-y-3">
        <div className="glass-card rounded-2xl p-3.5 text-xs border border-white/[0.08]">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-surface-200">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Estado del Sistema
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50 animate-pulse-subtle" />
          </div>
          
          <div className="space-y-1 font-mono text-[10px] text-surface-400">
            <div className="flex items-center justify-between">
              <span>Google Calendar:</span>
              <span className={isSyncingCalendar ? "text-cyan-400" : "text-emerald-400"}>
                {isSyncingCalendar ? "Sincronizando..." : "Conectado"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Latencia UI:</span>
              <span className="text-emerald-400">0ms (Optimista)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Supabase Postgres:</span>
              <span className="text-surface-300">Activo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] text-surface-500 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-surface-500" />
            Esquema life_os
          </span>
          <span>v2.1 Elite</span>
        </div>
      </div>
    </aside>
  );
}
