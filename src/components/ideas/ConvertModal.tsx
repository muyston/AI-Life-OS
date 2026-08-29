"use client";

import { useState } from "react";
import { 
  IdeaEntity, 
  IdeaRecommendedAction, 
  ProjectCategory, 
  PriorityLevel 
} from "@/lib/types";
import { 
  FolderKanban, 
  CheckSquare, 
  X, 
  Loader2, 
  Check, 
  Clock, 
  Layers 
} from "lucide-react";

interface ConvertModalProps {
  idea: IdeaEntity;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: "PROJECT" | "TASKS", count: number) => void;
}

export function ConvertModal({
  idea,
  isOpen,
  onClose,
  onSuccess,
}: ConvertModalProps) {
  const analysis = idea.structuredAnalysis;
  const actions: IdeaRecommendedAction[] = analysis?.recommendedActions || [];

  const [target, setTarget] = useState<"PROJECT" | "TASKS">("PROJECT");
  const [projectName, setProjectName] = useState(analysis?.suggestedProjectName || "Nuevo Proyecto");
  const [category, setCategory] = useState<ProjectCategory>(
    (["tech", "business", "academic", "performance", "personal"].includes(idea.category) 
      ? idea.category 
      : "tech") as ProjectCategory
  );
  const [priority, setPriority] = useState<PriorityLevel>("MEDIUM");
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    actions.map((_, i) => i)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleActionIndex = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === actions.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(actions.map((_, i) => i));
    }
  };

  const handleConvert = async () => {
    if (selectedIndices.length === 0) {
      setErrorMessage("Debes seleccionar al menos una accion.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch(`/api/ideas/${idea.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          projectName: target === "PROJECT" ? projectName : undefined,
          category: target === "PROJECT" ? category : undefined,
          priority: target === "PROJECT" ? priority : undefined,
          selectedActionIndices: selectedIndices,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al convertir la idea.");
      }

      onSuccess(target, json.data?.tasksCount || selectedIndices.length);
      onClose();
    } catch (err: unknown) {
      console.error("Error en conversion:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "Ocurrio un error durante la conversion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-900 border border-surface-800 rounded-lg max-w-xl w-full p-6 shadow-xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-800">
          <div>
            <h3 className="text-sm font-semibold text-surface-50 uppercase tracking-wide">
              Transformar Acciones de Idea
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">
              Convierte las recomendaciones estructuradas en entidades del sistema.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Target Switch */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTarget("PROJECT")}
            className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
              target === "PROJECT"
                ? "bg-surface-800 border-brand-500 text-surface-50 shadow-sm"
                : "bg-surface-950 border-surface-800 text-surface-400 hover:text-surface-200"
            }`}
          >
            <FolderKanban className={`w-5 h-5 shrink-0 mt-0.5 ${target === "PROJECT" ? "text-brand-500" : "text-surface-400"}`} />
            <div>
              <span className="text-xs font-semibold block">Crear Proyecto + Tareas</span>
              <span className="text-[11px] text-surface-400 block mt-0.5">
                Genera un proyecto contenedor y le asocia las acciones seleccionadas.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTarget("TASKS")}
            className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
              target === "TASKS"
                ? "bg-surface-800 border-brand-500 text-surface-50 shadow-sm"
                : "bg-surface-950 border-surface-800 text-surface-400 hover:text-surface-200"
            }`}
          >
            <CheckSquare className={`w-5 h-5 shrink-0 mt-0.5 ${target === "TASKS" ? "text-brand-500" : "text-surface-400"}`} />
            <div>
              <span className="text-xs font-semibold block">Tareas Sueltas</span>
              <span className="text-[11px] text-surface-400 block mt-0.5">
                Inserta las acciones directamente en la lista general de tareas.
              </span>
            </div>
          </button>
        </div>

        {/* Project Options */}
        {target === "PROJECT" && (
          <div className="space-y-3 p-3.5 bg-surface-950 rounded-lg border border-surface-800">
            <div>
              <label className="text-xs font-medium text-surface-300 block mb-1">
                Nombre del Proyecto
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded px-3 py-1.5 text-xs text-surface-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-300 block mb-1">
                  Dominio / Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full bg-surface-900 border border-surface-700 rounded px-2.5 py-1.5 text-xs text-surface-200 focus:outline-none"
                >
                  <option value="tech">Tech</option>
                  <option value="business">Business</option>
                  <option value="academic">Academic</option>
                  <option value="performance">Performance</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-surface-300 block mb-1">
                  Prioridad Inicial
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full bg-surface-900 border border-surface-700 rounded px-2.5 py-1.5 text-xs text-surface-200 focus:outline-none"
                >
                  <option value="LOW">Baja (LOW)</option>
                  <option value="MEDIUM">Media (MEDIUM)</option>
                  <option value="HIGH">Alta (HIGH)</option>
                  <option value="CRITICAL">Critica (CRITICAL)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Task Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-surface-300">
              Acciones a Crear ({selectedIndices.length}/{actions.length})
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] text-brand-500 hover:text-brand-400 transition-colors"
            >
              {selectedIndices.length === actions.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-surface-800/40">
            {actions.map((act, idx) => {
              const isChecked = selectedIndices.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleActionIndex(idx)}
                  className={`pt-2 flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                    isChecked ? "bg-surface-800/40" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-surface-700 text-brand-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-medium text-surface-200 block">{act.title}</span>
                    <span className="text-[11px] text-surface-400 block mt-0.5 line-clamp-1">
                      {act.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-surface-400">
                    <Clock className="w-3 h-3" />
                    <span>{act.estimatedDuration}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs text-surface-400 hover:text-surface-200 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConvert}
            disabled={isSubmitting || selectedIndices.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creando en base de datos...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar y Crear</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
