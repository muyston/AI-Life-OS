"use client";

import { TaskEntity, PriorityLevel } from "@/lib/types";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit3, 
  Bot, 
  Timer 
} from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: TaskEntity;
  onStatusToggle: (taskId: string, currentStatus: string) => void;
  onEdit?: (task: TaskEntity) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onStatusToggle, onEdit, onDelete }: TaskCardProps) {
  const isCompleted = task.status === "COMPLETED";

  const priorityColors: Record<PriorityLevel, string> = {
    URGENT: "bg-rose-950/60 text-rose-300 border-rose-800/80",
    CRITICAL: "bg-rose-950/60 text-rose-300 border-rose-800/80",
    HIGH: "bg-amber-950/60 text-amber-300 border-amber-800/80",
    MEDIUM: "bg-blue-950/60 text-blue-300 border-blue-800/80",
    LOW: "bg-surface-900 text-surface-400 border-white/[0.08]",
  };

  const priorityBadge = priorityColors[task.priority] || priorityColors.MEDIUM;

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all duration-150 ${
        isCompleted
          ? "bg-surface-950/40 border-white/[0.04] opacity-60"
          : "glass-card hover:border-white/15 shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onStatusToggle(task.id, task.status)}
            className="mt-0.5 text-surface-500 hover:text-brand-400 transition-colors shrink-0"
            title={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium break-words ${
                  isCompleted ? "line-through text-surface-500" : "text-surface-100"
                }`}
              >
                {task.title}
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-md border font-mono uppercase shrink-0 ${priorityBadge}`}>
                {task.priority}
              </span>
              {task.type === "AGENT_GENERATED" && (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md border bg-purple-950/60 text-purple-300 border-purple-800/80 font-mono shrink-0">
                  <Bot className="w-3 h-3" /> Agente
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-[11px] text-surface-400 mt-1 line-clamp-2 break-words">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2.5 mt-2 text-[10px] text-surface-400 flex-wrap font-mono">
              {task.project && (
                <span className="inline-flex items-center gap-1 text-surface-300 bg-surface-900 border border-white/[0.06] px-1.5 py-0.5 rounded-md">
                  <Tag className="w-3 h-3 text-surface-400" />
                  <span className="truncate max-w-[120px]">{task.project.name}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-surface-400">
                <Clock className="w-3 h-3" />
                {task.estimatedDuration} min
              </span>

              {task.deadline && (
                <span className="inline-flex items-center gap-1 text-amber-300/90">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.deadline), "dd/MM HH:mm")}
                </span>
              )}

              {task.scheduledStart && task.scheduledEnd && (
                <span className="inline-flex items-center gap-1 text-accent-300 bg-accent-950/50 px-1.5 py-0.5 rounded-md border border-accent-800/50">
                  {format(new Date(task.scheduledStart), "HH:mm")} - {format(new Date(task.scheduledEnd), "HH:mm")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isCompleted && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-focus-mode", { detail: task })
                );
              }}
              className="p-1 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-white/5 transition-colors"
              title="Iniciar sesión de Deep Work en esta tarea"
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors"
              title="Editar tarea"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1 rounded-lg text-surface-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
