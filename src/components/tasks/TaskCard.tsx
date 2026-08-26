"use client";

import { TaskEntity } from "@/lib/types";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit3,
  ExternalLink,
  Bot
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

  const priorityColors = {
    URGENT: "bg-red-950/60 text-red-400 border-red-800/80",
    CRITICAL: "bg-red-950/60 text-red-400 border-red-800/80",
    HIGH: "bg-amber-950/60 text-amber-400 border-amber-800/80",
    MEDIUM: "bg-blue-950/60 text-blue-400 border-blue-800/80",
    LOW: "bg-surface-800 text-surface-400 border-surface-700",
  };

  const statusColors = {
    PENDING: "text-surface-400",
    IN_PROGRESS: "text-accent-400 font-medium",
    COMPLETED: "text-brand-500 line-through opacity-70",
    CANCELLED: "text-surface-400 line-through opacity-50",
  };

  const priorityBadge = priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM;

  return (
    <div
      className={`p-3.5 rounded border transition-all ${
        isCompleted
          ? "bg-surface-900/40 border-surface-800/60 opacity-60"
          : "bg-surface-900 border-surface-800 hover:border-surface-700 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onStatusToggle(task.id, task.status)}
            className="mt-0.5 text-surface-400 hover:text-brand-500 transition-colors shrink-0"
            title={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium ${statusColors[task.status]}`}>
                {task.title}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase ${priorityBadge}`}>
                {task.priority}
              </span>
              {task.type === "AGENT_GENERATED" && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-purple-950/60 text-purple-400 border-purple-800/80 font-mono">
                  <Bot className="w-3 h-3" /> Agente
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-[11px] text-surface-400 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-[11px] text-surface-400 flex-wrap">
              {task.project && (
                <span className="inline-flex items-center gap-1 text-surface-400 bg-surface-800 px-1.5 py-0.5 rounded text-[10px]">
                  <Tag className="w-3 h-3" />
                  {task.project.name}
                </span>
              )}

              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-surface-400" />
                {task.estimatedDuration} min
              </span>

              {task.deadline && (
                <span className="inline-flex items-center gap-1 text-amber-400/90">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.deadline), "dd/MM/yyyy HH:mm")}
                </span>
              )}

              {task.scheduledStart && task.scheduledEnd && (
                <span className="inline-flex items-center gap-1 text-accent-400 bg-accent-950/50 px-1.5 py-0.5 rounded text-[10px] border border-accent-800/50">
                  Asignada: {format(new Date(task.scheduledStart), "HH:mm")} - {format(new Date(task.scheduledEnd), "HH:mm")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
              title="Editar tarea"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1 rounded text-surface-400 hover:text-red-400 hover:bg-surface-800 transition-colors"
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
