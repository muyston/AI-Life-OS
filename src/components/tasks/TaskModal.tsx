"use client";

import { useState, useEffect } from "react";
import { TaskEntity, ProjectEntity, PriorityLevel, TaskType, TaskStatus } from "@/lib/types";
import { X, Check } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<TaskEntity>) => Promise<void>;
  task?: TaskEntity | null;
  projects: ProjectEntity[];
}

export function TaskModal({ isOpen, onClose, onSave, task, projects }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [priority, setPriority] = useState<PriorityLevel>("MEDIUM");
  const [type, setType] = useState<TaskType>("NORMAL");
  const [status, setStatus] = useState<TaskStatus>("PENDING");
  const [deadline, setDeadline] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setProjectId(task.projectId || "");
      setPriority(task.priority);
      setType(task.type);
      setStatus(task.status);
      setEstimatedDuration(task.estimatedDuration || 30);
      setDeadline(
        task.deadline
          ? new Date(task.deadline).toISOString().slice(0, 16)
          : ""
      );
    } else {
      setTitle("");
      setDescription("");
      setProjectId("");
      setPriority("MEDIUM");
      setType("NORMAL");
      setStatus("PENDING");
      setEstimatedDuration(30);
      setDeadline("");
    }
    setError(null);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El titulo de la tarea es obligatorio.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: task?.id,
        title: title.trim(),
        description: description.trim() || null,
        projectId: projectId ? projectId : null,
        priority,
        type,
        status,
        estimatedDuration: Number(estimatedDuration),
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la tarea.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-lg w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
          <h2 className="text-sm font-semibold text-surface-100">
            {task ? "Editar Tarea" : "Nueva Tarea"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-surface-400 hover:text-surface-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1">
              Titulo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisar arquitectura de microservicios"
              className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 placeholder-surface-600 focus:outline-none focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1">
              Descripcion (opcional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles, contexto o notas relevantes..."
              className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 placeholder-surface-600 focus:outline-none focus:border-accent-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">
                Proyecto Asociado
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
              >
                <option value="">Sin proyecto asignado</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
              >
                <option value="LOW">Baja (LOW)</option>
                <option value="MEDIUM">Media (MEDIUM)</option>
                <option value="HIGH">Alta (HIGH)</option>
                <option value="URGENT">Urgente (URGENT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">
                Duracion Est. (min)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">
                Tipo de Tarea
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="MANUAL">Manual</option>
                <option value="RECURRING">Recurrente</option>
                <option value="AGENT_GENERATED">Agente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
              >
                <option value="PENDING">Pendiente</option>
                <option value="IN_PROGRESS">En curso</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1">
              Fecha Limite (Deadline)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded text-xs text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? "Guardando..." : "Guardar Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
