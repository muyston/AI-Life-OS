"use client";

import { useState } from "react";
import { 
  Search, 
  Timer, 
  Sparkles, 
  Plus, 
  Radio, 
  Calendar, 
  FolderKanban,
  CheckCircle2
} from "lucide-react";
import { useLifeOS } from "@/lib/store/life-os-store";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { VisionScheduleButton } from "@/components/vision/VisionScheduleButton";

export function HeaderNav() {
  const { 
    saveTask, 
    setFocusModalOpen, 
    setCommandPaletteOpen,
    tasks,
    habits
  } = useLifeOS();

  const [quickText, setQuickText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pendingTasksCount = tasks.filter((t) => t.status === "PENDING").length;
  const completedHabitsToday = habits.filter((h) => h.active && h.isCompletedToday).length;
  const totalActiveHabits = habits.filter((h) => h.active).length;

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const text = quickText.trim();

      let category = "tech";
      let cleanTitle = text;

      if (text.includes("#business")) {
        category = "business";
        cleanTitle = text.replace("#business", "").trim();
      } else if (text.includes("#academic")) {
        category = "academic";
        cleanTitle = text.replace("#academic", "").trim();
      } else if (text.includes("#performance")) {
        category = "performance";
        cleanTitle = text.replace("#performance", "").trim();
      } else if (text.includes("#personal")) {
        category = "personal";
        cleanTitle = text.replace("#personal", "").trim();
      } else if (text.includes("#tech")) {
        category = "tech";
        cleanTitle = text.replace("#tech", "").trim();
      }

      await saveTask({
        title: cleanTitle,
        priority: text.toLowerCase().includes("urgente") ? "URGENT" : "MEDIUM",
        estimatedDuration: 30,
        type: "NORMAL",
        origin: "MANUAL",
      });

      setQuickText("");
      setFeedback("Capturada en 0ms");
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback("Error al capturar");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Mobile Brand Badge */}
      <div className="flex md:hidden items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-xs">
          OS
        </div>
        <span className="font-semibold text-xs text-surface-100 tracking-tight">
          AI Life OS
        </span>
      </div>

      {/* Search / Command Palette Trigger */}
      <div className="flex-1 max-w-xl flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-surface-950/80 hover:bg-surface-800/80 border border-white/10 rounded-xl text-xs text-surface-400 hover:text-surface-200 transition-all group shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-3.5 h-3.5 text-surface-500 group-hover:text-cyan-400 shrink-0" />
            <span className="font-medium truncate">Buscar tareas, notas o ejecutar comandos...</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-surface-400 bg-surface-900 border border-white/10 rounded shadow-xs">
              Ctrl
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-surface-400 bg-surface-900 border border-white/10 rounded shadow-xs">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Omni Quick Capture Form */}
      <form onSubmit={handleQuickCapture} className="hidden lg:flex items-center gap-2 flex-1 max-w-md">
        <input
          type="text"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder="Captura rapida (#business, #tech, #upm)..."
          className="w-full px-3.5 py-2 bg-surface-950/80 border border-white/10 rounded-xl text-xs text-surface-100 placeholder-surface-500 focus:outline-hidden focus:border-cyan-500/50 font-medium"
        />
        {feedback && (
          <span className="text-[11px] font-mono text-cyan-400 whitespace-nowrap">
            {feedback}
          </span>
        )}
      </form>

      {/* Right Action Tools: HUD Status + Vision Capture + Voice Capture + Focus Studio */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface-900/60 border border-white/[0.06] text-xs font-mono text-surface-400">
          <span>{pendingTasksCount} tareas</span>
          <span>&bull;</span>
          <span className="text-emerald-400">{completedHabitsToday}/{totalActiveHabits} habitos</span>
        </div>

        <VisionScheduleButton
          variant="icon"
          title="Planificar rutina desde foto de horario o calendario"
          onRoutineApplied={() => {
            window.dispatchEvent(new CustomEvent("task-created"));
          }}
        />

        <VoiceInputButton
          variant="icon"
          title="Entrada de voz inteligente"
        />

        <button
          type="button"
          onClick={() => setFocusModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-950/80 hover:bg-surface-800 text-surface-200 border border-white/10 hover:border-cyan-500/30 rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95"
          title="Iniciar sesion de Focus Studio 2.0"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse-subtle" />
          <span className="hidden sm:inline">Focus Studio</span>
        </button>
      </div>
    </header>
  );
}
