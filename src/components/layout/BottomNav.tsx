"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  FolderKanban, 
  Calendar, 
  Bot 
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Hoy", href: "/", icon: LayoutDashboard },
    { name: "Inbox", href: "/ideas", icon: Inbox },
    { name: "Tareas", href: "/tasks", icon: CheckSquare },
    { name: "Proyectos", href: "/projects", icon: FolderKanban },
    { name: "Agenda", href: "/calendar", icon: Calendar },
    { name: "Agentes", href: "/agents", icon: Bot },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-900/95 backdrop-blur-md border-t border-surface-800 px-1.5 py-1 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors min-w-[48px] ${
                isActive
                  ? "text-accent-400 font-semibold bg-surface-800/60"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-accent-400" : "text-surface-400"}`} />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

