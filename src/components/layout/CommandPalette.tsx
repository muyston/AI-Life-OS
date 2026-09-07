"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowRight,
  Flame,
  Radio,
  Sliders
} from "lucide-react";
import { useLifeOS } from "@/lib/store/life-os-store";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Acciones Rapidas" | "Navegacion" | "Proyectos" | "Tareas" | "Habitos" | "Agenda";
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  badge?: string;
}

export function CommandPalette() {
  const {
    tasks,
    projects,
    habits,
    events,
    freeSlots,
    syncCalendar,
    toggleTaskStatus,
    setActiveFocusTask,
    setFocusModalOpen,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    refreshAll,
  } = useLifeOS();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const router = useRouter();

  const closePalette = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery("");
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        e.preventDefault();
        closePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, closePalette, setCommandPaletteOpen]);

  // Construccion reactiva y enriquecida de items
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Acciones Rapidas
      {
        id: "action-open-focus",
        title: "Abrir Focus Studio 2.0 (Deep Work)",
        subtitle: "Iniciar sesion inmersiva con sintetizador de ondas alfa o ruido marron",
        category: "Acciones Rapidas",
        icon: Radio,
        badge: "Enfoque",
        onSelect: () => {
          setFocusModalOpen(true);
          closePalette();
        },
      },
      {
        id: "action-sync-calendar",
        title: "Sincronizar Google Calendar (iCal)",
        subtitle: "Actualizar eventos en vivo y recalcular ventanas libres",
        category: "Acciones Rapidas",
        icon: Calendar,
        badge: "Agenda",
        onSelect: async () => {
          setIsExecuting(true);
          try {
            await syncCalendar();
          } finally {
            setIsExecuting(false);
            closePalette();
          }
        },
      },
      {
        id: "action-run-operations",
        title: "Ejecutar Agente de Operaciones",
        subtitle: "Calcular propuesta de time-blocking inteligente para hoy",
        category: "Acciones Rapidas",
        icon: Bot,
        badge: "Agentes IA",
        onSelect: async () => {
          setIsExecuting(true);
          try {
            await fetch("/api/agents/run", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agentName: "OPERATIONS", triggerType: "MANUAL" }),
            });
            await refreshAll();
          } finally {
            setIsExecuting(false);
            closePalette();
          }
        },
      },
      // Navegacion Principal
      {
        id: "nav-daily",
        title: "Ir a Vista Diaria",
        subtitle: "Panel principal de biorritmo, agenda y tareas de hoy",
        category: "Navegacion",
        icon: Laptop,
        badge: "/",
        onSelect: () => {
          router.push("/");
          closePalette();
        },
      },
      {
        id: "nav-inbox",
        title: "Ir a Smart Inbox (Ideas)",
        subtitle: "Laboratorio de captura y resolucion multidimensional",
        category: "Navegacion",
        icon: Inbox,
        badge: "/ideas",
        onSelect: () => {
          router.push("/ideas");
          closePalette();
        },
      },
      {
        id: "nav-habits",
        title: "Ir a Habitos & Streaks",
        subtitle: "Matriz de constancia semanal y rendimiento vital",
        category: "Navegacion",
        icon: Flame,
        badge: "/habits",
        onSelect: () => {
          router.push("/habits");
          closePalette();
        },
      },
      {
        id: "nav-tasks",
        title: "Ir a Todas las Tareas",
        subtitle: "Gestion de backlog, prioridades y estados operativos",
        category: "Navegacion",
        icon: CheckSquare,
        badge: "/tasks",
        onSelect: () => {
          router.push("/tasks");
          closePalette();
        },
      },
      {
        id: "nav-calendar",
        title: "Ir a Calendario Completo",
        subtitle: "Vista de mes, semana y dia con sincronizacion Google",
        category: "Navegacion",
        icon: CalendarCheck,
        badge: "/calendar",
        onSelect: () => {
          router.push("/calendar");
          closePalette();
        },
      },
      {
        id: "nav-projects",
        title: "Ir a Proyectos",
        subtitle: "Dominios estrategicos: Tech, Business, UPM, Rendimiento",
        category: "Navegacion",
        icon: FolderKanban,
        badge: "/projects",
        onSelect: () => {
          router.push("/projects");
          closePalette();
        },
      },
      {
        id: "nav-agents",
        title: "Ir a Consola de Agentes",
        subtitle: "Especialistas autonomos y trazabilidad de ejecuciones",
        category: "Navegacion",
        icon: Bot,
        badge: "/agents",
        onSelect: () => {
          router.push("/agents");
          closePalette();
        },
      },
    ];

    // Habitos activos
    habits.slice(0, 5).forEach((h) => {
      list.push({
        id: `habit-${h.id}`,
        title: `Habito: ${h.title}`,
        subtitle: `Racha: ${h.streak} dias consecutivos &bull; ${h.isCompletedToday ? "Completado hoy" : "Pendiente hoy"}`,
        category: "Habitos",
        icon: Flame,
        badge: h.category,
        onSelect: () => {
          router.push("/habits");
          closePalette();
        },
      });
    });

    // Proyectos activos
    projects.slice(0, 8).forEach((p) => {
      list.push({
        id: `proj-${p.id}`,
        title: p.name,
        subtitle: p.description ? p.description.slice(0, 70) : `Dominio: ${p.category}`,
        category: "Proyectos",
        icon: FolderKanban,
        badge: p.category,
        onSelect: () => {
          router.push(`/projects?id=${p.id}`);
          closePalette();
        },
      });
    });

    // Tareas pendientes
    tasks.filter(t => t.status === "PENDING").slice(0, 10).forEach((t) => {
      list.push({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: `${t.estimatedDuration} min &bull; ${t.project?.name || "Sin proyecto"} &bull; Prioridad: ${t.priority}`,
        category: "Tareas",
        icon: CheckSquare,
        badge: t.priority,
        onSelect: () => {
          setActiveFocusTask(t);
          setFocusModalOpen(true);
          closePalette();
        },
      });
    });

    // Eventos de agenda
    events.slice(0, 5).forEach((e) => {
      list.push({
        id: `event-${e.id}`,
        title: e.summary,
        subtitle: `${new Date(e.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(e.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        category: "Agenda",
        icon: Calendar,
        badge: "Google",
        onSelect: () => {
          router.push("/calendar");
          closePalette();
        },
      });
    });

    return list;
  }, [
    habits, 
    projects, 
    tasks, 
    events, 
    router, 
    closePalette, 
    syncCalendar, 
    refreshAll, 
    setFocusModalOpen, 
    setActiveFocusTask
  ]);

  // Filtrado reactivo en 0ms
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

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ willChange: "transform" }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-xl"
        onClick={closePalette}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{ willChange: "transform" }}
          className="w-full max-w-xl bg-surface-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barra de Entrada Superior */}
          <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3">
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownList}
              placeholder="Escribe un comando, tarea, habito o proyecto..."
              className="flex-1 bg-transparent text-sm text-surface-50 placeholder:text-surface-500 focus:outline-hidden"
            />
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-surface-900 border border-white/10 text-surface-400">
                ESC
              </span>
            )}
          </div>

          {/* Listado de Resultados */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-surface-500 font-mono">
                No se encontraron resultados para &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onSelect}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? "bg-surface-800/80 border border-white/10 text-surface-50 shadow-xs"
                        : "text-surface-400 hover:text-surface-100 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected 
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" 
                          : "bg-surface-900/60 text-surface-400 border-white/[0.06]"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-surface-100 block truncate">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="text-[11px] text-surface-400 block truncate mt-0.5">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-900 border border-white/[0.08] text-surface-400">
                          {item.badge}
                        </span>
                      )}
                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer del Command Palette */}
          <div className="px-4 py-2.5 bg-surface-950/80 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-surface-400 font-mono">
            <div className="flex items-center gap-3">
              <span>&uarr;&darr; Navegar</span>
              <span>&crarr; Ejecutar</span>
            </div>
            <span>AI Life OS Pro</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
