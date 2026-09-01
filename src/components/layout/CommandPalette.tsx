"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Command, 
  Calendar, 
  CheckSquare, 
  FolderKanban, 
  Bot, 
  Inbox, 
  RefreshCw, 
  Plus, 
  Timer, 
  CalendarCheck, 
  Sparkles, 
  X,
  ExternalLink,
  Laptop,
  ArrowRight
} from "lucide-react";
import { ProjectEntity, TaskEntity, CalendarEventEntity } from "@/lib/types";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Acciones Rápidas" | "Navegación" | "Proyectos" | "Tareas" | "Agenda";
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  badge?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const router = useRouter();

  const loadSearchData = useCallback(async () => {
    try {
      const [projRes, tasksRes, calRes] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/tasks?status=ALL", { cache: "no-store" }),
        fetch("/api/calendar/events", { cache: "no-store" }),
      ]);
      const projData = await projRes.json();
      const tasksData = await tasksRes.json();
      const calData = await calRes.json();

      if (projData.success) setProjects(projData.data);
      if (tasksData.success) setTasks(tasksData.data);
      if (calData.success) setEvents(calData.data.events || []);
    } catch {
      // Ignorar error en precarga
    }
  }, []);

  const openPalette = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(0);
    loadSearchData();
  }, [loadSearchData]);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            loadSearchData();
          }
          return !prev;
        });
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        closePalette();
      }
    };

    const handleCustomOpen = () => openPalette();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen, openPalette, closePalette, loadSearchData]);

  // Construcción reactiva de comandos
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Acciones Rápidas
      {
        id: "action-sync-antigravity",
        title: "Sincronizar Workspaces de Antigravity",
        subtitle: "Escanear directorios locales y repositorios remotos",
        category: "Acciones Rápidas",
        icon: RefreshCw,
        badge: "Workspace",
        onSelect: async () => {
          setIsExecuting(true);
          try {
            await fetch("/api/projects/sync", { method: "POST" });
            router.refresh();
          } finally {
            setIsExecuting(false);
            closePalette();
          }
        },
      },
      {
        id: "action-sync-calendar",
        title: "Sincronizar Google Calendar (iCal)",
        subtitle: "Descargar eventos y recalcular huecos libres",
        category: "Acciones Rápidas",
        icon: Calendar,
        badge: "Agenda",
        onSelect: async () => {
          setIsExecuting(true);
          try {
            await fetch("/api/calendar/sync", { method: "POST" });
            router.refresh();
          } finally {
            setIsExecuting(false);
            closePalette();
          }
        },
      },
      {
        id: "action-run-pipeline",
        title: "Ejecutar Pipeline Multi-Agente",
        subtitle: "Orquestador, Estrategia, Ventas, Dev y Operaciones",
        category: "Acciones Rápidas",
        icon: Sparkles,
        badge: "Orchestrator",
        onSelect: async () => {
          setIsExecuting(true);
          try {
            await fetch("/api/agents/run", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agentName: "ORCHESTRATOR", triggerType: "MANUAL" }),
            });
            router.push("/");
          } finally {
            setIsExecuting(false);
            closePalette();
          }
        },
      },
      {
        id: "action-focus-mode",
        title: "Iniciar Modo Focus / Deep Work",
        subtitle: "Bloque de concentración sin distracciones con temporizador",
        category: "Acciones Rápidas",
        icon: Timer,
        badge: "Productividad",
        onSelect: () => {
          closePalette();
          window.dispatchEvent(new CustomEvent("open-focus-mode"));
        },
      },

      // Navegación
      {
        id: "nav-dashboard",
        title: "Vista Diaria & Planificación",
        subtitle: "Timeline de eventos, tareas del día y feed de acciones IA",
        category: "Navegación",
        icon: CheckSquare,
        onSelect: () => {
          router.push("/");
          closePalette();
        },
      },
      {
        id: "nav-inbox",
        title: "Smart Inbox / Laboratorio de Ideas",
        subtitle: "Captura de ideas y análisis automatizado multidominio",
        category: "Navegación",
        icon: Inbox,
        onSelect: () => {
          router.push("/ideas");
          closePalette();
        },
      },
      {
        id: "nav-projects",
        title: "Gestión de Proyectos & Workspaces",
        subtitle: "Vista Grid y Kanban clasificada por dominio",
        category: "Navegación",
        icon: FolderKanban,
        onSelect: () => {
          router.push("/projects");
          closePalette();
        },
      },
      {
        id: "nav-tasks",
        title: "Tablero de Tareas Operativas",
        subtitle: "Todas las tareas, filtros por prioridad y estado",
        category: "Navegación",
        icon: CheckSquare,
        onSelect: () => {
          router.push("/tasks");
          closePalette();
        },
      },
      {
        id: "nav-calendar",
        title: "Agenda & Google Calendar",
        subtitle: "Eventos, configuración iCal privada y huecos libres",
        category: "Navegación",
        icon: Calendar,
        onSelect: () => {
          router.push("/calendar");
          closePalette();
        },
      },
      {
        id: "nav-agents",
        title: "Panel de Agentes Especialistas",
        subtitle: "Telemetría, ejecuciones y control multi-agente",
        category: "Navegación",
        icon: Bot,
        onSelect: () => {
          router.push("/agents");
          closePalette();
        },
      },
    ];

    // Añadir Proyectos descubiertos
    for (const p of projects) {
      list.push({
        id: `proj-${p.id}`,
        title: p.name,
        subtitle: p.description || `Categoría: ${p.category} - Estado: ${p.status}`,
        category: "Proyectos",
        icon: FolderKanban,
        badge: p.category.toUpperCase(),
        onSelect: () => {
          router.push("/projects");
          closePalette();
        },
      });
    }

    // Añadir Tareas pendientes
    for (const t of tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").slice(0, 15)) {
      list.push({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: t.description || `Prioridad: ${t.priority} - ${t.estimatedDuration} min`,
        category: "Tareas",
        icon: CheckSquare,
        badge: t.priority,
        onSelect: () => {
          router.push("/tasks");
          closePalette();
        },
      });
    }

    // Añadir Eventos de calendario de hoy
    for (const ev of events.slice(0, 8)) {
      list.push({
        id: `event-${ev.id}`,
        title: ev.summary,
        subtitle: ev.location || "Evento sincronizado desde Google Calendar",
        category: "Agenda",
        icon: CalendarCheck,
        badge: ev.isAllDay ? "Todo el día" : "Google",
        onSelect: () => {
          router.push("/calendar");
          closePalette();
        },
      });
    }

    return list;
  }, [projects, tasks, events, router, closePalette]);

  // Filtrado reactivo por query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [items, query]);

  // Manejo de flechas de teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, selectedIndex, filteredItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100">
      <div className="bg-surface-900 border border-surface-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-100">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-surface-800 gap-3 bg-surface-950">
          <Search className="w-4 h-4 text-surface-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar proyectos, tareas, eventos o ejecutar comandos..."
            className="w-full bg-transparent text-xs text-surface-100 placeholder-surface-500 focus:outline-none font-medium"
          />
          {isExecuting ? (
            <RefreshCw className="w-4 h-4 text-accent-400 animate-spin" />
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-surface-400 bg-surface-800 border border-surface-700 rounded">
              ESC
            </kbd>
          )}
          <button
            type="button"
            onClick={closePalette}
            className="p-1 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-surface-400">
              No se han encontrado resultados para &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-surface-800 text-surface-50 border border-surface-700/80"
                      : "text-surface-300 hover:bg-surface-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-surface-700 text-accent-400" : "bg-surface-950 text-surface-400 border border-surface-800"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate block">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-surface-700 bg-surface-950 text-surface-400 uppercase shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-surface-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-mono text-surface-400 uppercase hidden sm:inline">
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? "text-accent-400 translate-x-0.5" : "text-surface-600"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-surface-950 border-t border-surface-800 flex items-center justify-between text-[11px] text-surface-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Seleccionar</span>
            <span>ESC Salir</span>
          </div>
          <span>AI Life OS Command Center</span>
        </div>
      </div>
    </div>
  );
}
