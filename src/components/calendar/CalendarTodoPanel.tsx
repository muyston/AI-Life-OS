"use client";

import { useState } from "react";
import { 
  CheckSquare, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  CalendarPlus, 
  Filter,
  Flame,
  ArrowRight,
  Radio
} from "lucide-react";
import { TaskEntity, PriorityLevel, TaskStatus, FreeTimeSlot } from "@/lib/types";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";

interface CalendarTodoPanelProps {
  tasks: TaskEntity[];
  onToggleStatus: (taskId: string, currentStatus: string) => Promise<void>;
  onAddTask: (taskData: Partial<TaskEntity>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  freeSlots?: FreeTimeSlot[];
  onRefresh?: () => void;
}

export function CalendarTodoPanel({
  tasks,
  onToggleStatus,
  onAddTask,
  onDeleteTask,
  freeSlots = [],
  onRefresh,
}: CalendarTodoPanelProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"PENDING" | "URGENT" | "ALL" | "COMPLETED">("PENDING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const text = quickTitle.trim();
      const isUrgent = text.toLowerCase().includes("urgente") || text.toLowerCase().includes("asap");

      await onAddTask({
        title: text,
        priority: isUrgent ? "URGENT" : "MEDIUM",
        estimatedDuration: 30,
        type: "NORMAL",
        origin: "MANUAL",
      });

      setQuickTitle("");
      if (onRefresh) onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedFilter === "PENDING") return t.status === "PENDING" || t.status === "IN_PROGRESS";
    if (selectedFilter === "URGENT") return (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "COMPLETED";
    if (selectedFilter === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  const priorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case "URGENT":
      case "CRITICAL":
        return "text-rose-400 bg-rose-950/60 border-rose-800/80";
      case "HIGH":
        return "text-amber-400 bg-amber-950/60 border-amber-800/80";
      case "MEDIUM":
        return "text-blue-400 bg-blue-950/60 border-blue-800/80";
      case "LOW":
      default:
        return "text-surface-400 bg-surface-900 border-surface-800";
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col h-full border border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
              Organizador Rápido (To-Do)
            </h3>
            <span className="text-[10px] text-surface-400 font-mono">
              Planifica y tacha tareas al instante
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-900 text-accent-300 border border-white/[0.06]">
          {filteredTasks.length}
        </span>
      </div>

      {/* Quick Add Form with Voice Button */}
      <form onSubmit={handleQuickSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Añadir tarea rápida..."
          className="flex-1 px-3 py-2 bg-surface-950/90 border border-white/10 rounded-xl text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-accent-500 font-medium"
        />

        <VoiceInputButton
          variant="compact"
          onActionCompleted={onRefresh}
          title="Dictar tarea por voz"
        />

        <button
          type="submit"
          disabled={isSubmitting || !quickTitle.trim()}
          className="p-2 rounded-xl bg-accent-600 hover:bg-accent-500 text-white transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-950/80 rounded-xl border border-white/[0.06] text-[11px]">
        <button
          type="button"
          onClick={() => setSelectedFilter("PENDING")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            selectedFilter === "PENDING"
              ? "bg-surface-800 text-surface-100 shadow-xs"
              : "text-surface-400 hover:text-surface-200"
          }`}
        >
          Pendientes
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("URGENT")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            selectedFilter === "URGENT"
              ? "bg-surface-800 text-rose-300 shadow-xs"
              : "text-surface-400 hover:text-surface-200"
          }`}
        >
          Urgentes
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("ALL")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            selectedFilter === "ALL"
              ? "bg-surface-800 text-surface-100 shadow-xs"
              : "text-surface-400 hover:text-surface-200"
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("COMPLETED")}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            selectedFilter === "COMPLETED"
              ? "bg-surface-800 text-emerald-300 shadow-xs"
              : "text-surface-400 hover:text-surface-200"
          }`}
        >
          Hechas
        </button>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] max-h-[500px] pr-1">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-surface-500">
            No hay tareas en esta vista.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-xl border transition-all duration-150 flex items-start justify-between gap-2.5 ${
                task.status === "COMPLETED"
                  ? "bg-surface-950/40 border-white/[0.04] opacity-60"
                  : "glass-card hover:border-white/15"
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleStatus(task.id, task.status)}
                  className="mt-0.5 text-surface-500 hover:text-brand-400 transition-colors shrink-0"
                >
                  {task.status === "COMPLETED" ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-surface-500" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-medium truncate block ${
                        task.status === "COMPLETED" ? "line-through text-surface-500" : "text-surface-100"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${priorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-surface-400 font-mono">
                      {task.estimatedDuration} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-focus-mode", { detail: task }));
                  }}
                  className="p-1 rounded hover:bg-cyan-950/60 text-surface-500 hover:text-cyan-400 transition-colors"
                  title="Abrir Focus Studio en esta tarea"
                >
                  <Radio className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 rounded hover:bg-white/5 text-surface-500 hover:text-rose-400 transition-colors"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
