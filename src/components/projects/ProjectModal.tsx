"use client";

import { useState, useEffect } from "react";
import { ProjectEntity, ProjectStatus, PriorityLevel } from "@/lib/types";
import { X, Check } from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<ProjectEntity>) => Promise<void>;
  project?: ProjectEntity | null;
}

export function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [priority, setPriority] = useState<PriorityLevel>("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setRepoUrl(project.repoUrl || "");
      setStatus(project.status);
      setPriority(project.priority);
    } else {
      setName("");
      setDescription("");
      setRepoUrl("");
      setStatus("ACTIVE");
      setPriority("MEDIUM");
    }
    setError(null);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: project?.id,
        name: name.trim(),
        description: description.trim() || null,
        repoUrl: repoUrl.trim() || null,
        status,
        priority,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el proyecto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-lg w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
          <h2 className="text-sm font-semibold text-surface-100">
            {project ? "Editar Proyecto" : "Nuevo Proyecto"}
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
              Nombre del Proyecto <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Life OS Core"
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
              placeholder="Objetivos, alcance o notas tecnicas..."
              className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 placeholder-surface-600 focus:outline-none focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1">
              URL del Repositorio GitHub (opcional)
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/usuario/repo"
              className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 placeholder-surface-600 focus:outline-none focus:border-accent-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
              >
                <option value="ACTIVE">Activo</option>
                <option value="ON_HOLD">En Pausa</option>
                <option value="COMPLETED">Completado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">
                Prioridad General
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
              >
                <option value="LOW">Baja (LOW)</option>
                <option value="MEDIUM">Media (MEDIUM)</option>
                <option value="HIGH">Alta (HIGH)</option>
                <option value="CRITICAL">Critica (CRITICAL)</option>
              </select>
            </div>
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
              {isSubmitting ? "Guardando..." : "Guardar Proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
