"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  Flame,
  CheckSquare, 
  Calendar, 
  FolderKanban, 
  Bot 
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Hoy", href: "/", icon: LayoutDashboard },
    { name: "Inbox", href: "/ideas", icon: Inbox },
    { name: "Hábitos", href: "/habits", icon: Flame },
    { name: "Tareas", href: "/tasks", icon: CheckSquare },
    { name: "Agenda", href: "/calendar", icon: Calendar },
    { name: "Proyectos", href: "/projects", icon: FolderKanban },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-1 py-1 safe-area-pb shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[48px] active:scale-95 ${
                isActive
                  ? "text-accent-400 font-semibold bg-white/[0.08]"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-accent-400" : "text-surface-400"}`} />
              <span className="text-[9px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
