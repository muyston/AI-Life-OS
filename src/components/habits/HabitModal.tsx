"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, Sparkles, Check, Code2, Briefcase, GraduationCap, Dumbbell, User } from "lucide-react";
import { HabitWithStats, ProjectCategory, HabitFrequency } from "@/lib/types";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<HabitWithStats>) => Promise<void>;
  habit?: HabitWithStats | null;
}

export function HabitModal({ isOpen, onClose, onSave, habit }: HabitModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("tech");
  const [frequency, setFrequency] = useState<HabitFrequency>("DAILY");
  const [targetDays, setTargetDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || "");
      setCategory(habit.category || "tech");
      setFrequency((habit.frequency as HabitFrequency) || "DAILY");
      setTargetDays(habit.targetDays || 7);
    } else {
      setTitle("");
      setDescription("");
      setCategory("tech");
      setFrequency("DAILY");
      setTargetDays(7);
    }
    setError(null);
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título del hábito es obligatorio.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        ...(habit ? { id: habit.id } : {}),
        title: title.trim(),
        description: description.trim() || null,
        category,
        frequency,
        targetDays,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el hábito.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { id: ProjectCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "tech", label: "Tech & Código", icon: Code2 },
    { id: "business", label: "Business & Ventas", icon: Briefcase },
    { id: "academic", label: "Académico / UPM", icon: GraduationCap },
    { id: "performance", label: "Performance / Físico", icon: Dumbbell },
    { id: "personal", label: "Personal & Salud", icon: User },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="glass-panel rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-white/10 animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100">
                {habit ? "Editar Hábito" : "Nuevo Hábito No Negociable"}
              </h2>
              <span className="text-[11px] text-surface-400 font-mono block">
                Define la disciplina y frecuencia objetivo
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-200 mb-1.5">
              Título del Hábito *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: 60 min Estudio / Proyecto MotoStudent UPM"
              className="w-full px-3 py-2 bg-surface-950/90 border border-white/10 rounded-xl text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-200 mb-1.5">
              Descripción / Criterio de Cumplimiento
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle concreto de qué constituye haber cumplido el hábito hoy..."
              className="w-full px-3 py-2 bg-surface-950/90 border border-white/10 rounded-xl text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-surface-200 mb-1.5">
              Dominio / Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                      isSelected
                        ? "bg-surface-800 border-accent-500 text-surface-50 font-medium"
                        : "bg-surface-950 border-white/[0.06] text-surface-400 hover:text-surface-200 hover:bg-surface-900"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-accent-400" : "text-surface-400"}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frecuencia y Días Objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-200 mb-1.5">
                Frecuencia
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  const f = e.target.value as HabitFrequency;
                  setFrequency(f);
                  if (f === "WEEKDAYS") setTargetDays(5);
                  if (f === "DAILY") setTargetDays(7);
                }}
                className="w-full px-3 py-2 bg-surface-950/90 border border-white/10 rounded-xl text-xs text-surface-200 focus:outline-none focus:border-brand-500"
              >
                <option value="DAILY">Diario (7 días/semana)</option>
                <option value="WEEKDAYS">Días Laborales (5 días)</option>
                <option value="WEEKLY">Semanal / Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-200 mb-1.5">
                Días Objetivo por Semana: {targetDays} días
              </label>
              <input
                type="range"
                min={1}
                max={7}
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-full mt-2 accent-brand-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-surface-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium transition-all shadow-md disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Guardando..." : habit ? "Actualizar Hábito" : "Crear Hábito"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
