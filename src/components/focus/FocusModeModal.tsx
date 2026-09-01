"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Clock, 
  FileText, 
  Zap,
  Laptop
} from "lucide-react";
import { TaskEntity } from "@/lib/types";

interface FocusModeModalProps {
  initialTask?: TaskEntity | null;
  onClose?: () => void;
  onTaskCompleted?: (taskId: string) => void;
}

export function FocusModeModal({ initialTask, onClose, onTaskCompleted }: FocusModeModalProps) {
  const [isOpen, setIsOpen] = useState(Boolean(initialTask));
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskEntity | null>(initialTask || null);

  // Timer state
  const [presetMinutes, setPresetMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadPendingTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?status=PENDING");
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(data.data);
        if (!selectedTask && data.data.length > 0) {
          setSelectedTask(data.data[0]);
        }
      }
    } catch {
      // Ignorar error
    }
  }, [selectedTask]);

  useEffect(() => {
    const handleOpenFocus = (e: Event) => {
      const customEvent = e as CustomEvent<TaskEntity | undefined>;
      if (customEvent.detail) {
        setSelectedTask(customEvent.detail);
      }
      setIsOpen(true);
      loadPendingTasks();
    };

    window.addEventListener("open-focus-mode", handleOpenFocus);
    return () => window.removeEventListener("open-focus-mode", handleOpenFocus);
  }, [loadPendingTasks]);

  useEffect(() => {
    if (initialTask) {
      setSelectedTask(initialTask);
      setIsOpen(true);
    }
  }, [initialTask]);

  // Countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleSelectPreset = (mins: number) => {
    setPresetMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(presetMinutes * 60);
  };

  const handleFinishSession = async (markCompleted: boolean) => {
    if (!selectedTask) return;
    try {
      setIsSaving(true);
      const elapsedSeconds = presetMinutes * 60 - secondsRemaining;
      const minutesSpent = Math.max(1, Math.round(elapsedSeconds / 60));

      await fetch(`/api/tasks/${selectedTask.id}/time-track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutesSpent,
          notes,
          markCompleted,
        }),
      });

      if (markCompleted && onTaskCompleted) {
        onTaskCompleted(selectedTask.id);
      }

      setIsOpen(false);
      if (onClose) onClose();
    } catch (err) {
      console.error("Error al finalizar sesión de foco:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = Math.round(((presetMinutes * 60 - secondsRemaining) / (presetMinutes * 60)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-surface-900 border border-surface-700 rounded-2xl max-w-xl w-full p-8 shadow-2xl space-y-6 flex flex-col justify-between max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-brand-400" />
            <span className="text-sm font-bold uppercase tracking-wider text-surface-100 font-mono">
              Modo Focus & Deep Work
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onClose) onClose();
            }}
            className="p-1 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Selector */}
        <div>
          <label className="block text-xs font-mono text-surface-400 uppercase mb-1.5">
            Tarea Activa en Foco
          </label>
          {selectedTask ? (
            <div className="p-3.5 rounded-lg bg-surface-950 border border-surface-700 flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-surface-100 block">
                  {selectedTask.title}
                </span>
                {selectedTask.description && (
                  <p className="text-[11px] text-surface-400 mt-1 line-clamp-2">
                    {selectedTask.description}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-surface-700 bg-surface-900 text-brand-400 shrink-0">
                {selectedTask.priority}
              </span>
            </div>
          ) : (
            <select
              onChange={(e) => {
                const found = tasks.find((t) => t.id === e.target.value);
                if (found) setSelectedTask(found);
              }}
              className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded text-xs text-surface-100 focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="">Seleccionar una tarea pendiente...</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Presets */}
        <div className="flex items-center justify-center gap-2">
          {[
            { label: "25 min Pomodoro", mins: 25 },
            { label: "50 min Deep Work", mins: 50 },
            { label: "90 min Sólido", mins: 90 },
          ].map((preset) => (
            <button
              key={preset.mins}
              type="button"
              onClick={() => handleSelectPreset(preset.mins)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                presetMinutes === preset.mins
                  ? "bg-brand-950 border-brand-500 text-brand-300 font-semibold"
                  : "bg-surface-950 border-surface-800 text-surface-400 hover:text-surface-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Big Countdown Timer */}
        <div className="text-center py-6 bg-surface-950 border border-surface-800 rounded-xl space-y-2">
          <div className="text-6xl font-bold font-mono tracking-tight text-surface-50">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          <div className="w-48 mx-auto h-1.5 bg-surface-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-1000 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <p className="text-[11px] font-mono text-surface-400 pt-1">
            Progreso: {progressPercent}% completado
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-full bg-surface-800 hover:bg-surface-700 text-surface-300 transition-colors"
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            className={`px-8 py-3 rounded-xl font-semibold text-xs transition-all shadow-lg flex items-center gap-2 ${
              isRunning
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950"
                : "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-950"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Iniciar Concentración
              </>
            )}
          </button>
        </div>

        {/* Scratchpad notes */}
        <div>
          <label className="block text-xs font-mono text-surface-400 uppercase mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-accent-400" />
            Notas Rápidas de Sesión (Scratchpad)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotaciones, código generado o decisiones tomadas durante este bloque..."
            className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-xs text-surface-100 placeholder-surface-600 focus:outline-none focus:border-accent-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-800 gap-3">
          <button
            type="button"
            onClick={() => handleFinishSession(false)}
            disabled={isSaving || !selectedTask}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            Guardar Tiempo y Seguir
          </button>

          <button
            type="button"
            onClick={() => handleFinishSession(true)}
            disabled={isSaving || !selectedTask}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar Tarea Completada
          </button>
        </div>
      </div>
    </div>
  );
}
