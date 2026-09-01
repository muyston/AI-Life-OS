"use client";

import { useState } from "react";
import { 
  Search, 
  Command, 
  Timer, 
  Sparkles, 
  Plus, 
  Activity, 
  Calendar, 
  FolderKanban 
} from "lucide-react";

export function HeaderNav() {
  const [quickText, setQuickText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOpenPalette = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const handleOpenFocus = () => {
    window.dispatchEvent(new CustomEvent("open-focus-mode"));
  };

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const text = quickText.trim();

      // Detección automática de dominio o categoría si usa hashtag
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

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          priority: text.toLowerCase().includes("urgente") ? "URGENT" : "MEDIUM",
          estimatedDuration: 30,
          type: "NORMAL",
          origin: "MANUAL",
        }),
      });

      if (res.ok) {
        setQuickText("");
        setFeedback("Tarea capturada");
        setTimeout(() => setFeedback(null), 3000);
        window.dispatchEvent(new CustomEvent("task-created"));
      }
    } catch {
      setFeedback("Error al capturar");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="h-16 bg-surface-900 border-b border-surface-800 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Mobile Brand Badge (Shown only on mobile when sidebar is hidden) */}
      <div className="flex md:hidden items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded bg-surface-800 border border-surface-700 flex items-center justify-center text-brand-500 font-bold text-xs">
          OS
        </div>
        <span className="font-semibold text-xs text-surface-100 tracking-tight">
          Life OS
        </span>
      </div>

      {/* Search / Command Palette Trigger */}
      <div className="flex-1 max-w-xl flex items-center gap-3">
        <button
          type="button"
          onClick={handleOpenPalette}
          className="w-full flex items-center justify-between px-3 py-2 bg-surface-950 hover:bg-surface-800/80 border border-surface-800 rounded-lg text-xs text-surface-400 hover:text-surface-200 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-surface-500 group-hover:text-accent-400 shrink-0" />
            <span className="font-medium truncate">Buscar o comando...</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-surface-400 bg-surface-900 border border-surface-700 rounded shadow-xs">
              Ctrl
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-surface-400 bg-surface-900 border border-surface-700 rounded shadow-xs">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Omni Quick Capture Form */}
      <form onSubmit={handleQuickCapture} className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <input
          type="text"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder="Captura rápida (ej: #business revisar leads)..."
          className="w-full px-3 py-2 bg-surface-950 border border-surface-800 rounded-lg text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-accent-500"
        />
        {feedback && (
          <span className="text-[11px] font-mono text-brand-400 whitespace-nowrap">
            {feedback}
          </span>
        )}
      </form>

      {/* Right Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleOpenFocus}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-950 hover:bg-surface-800 text-surface-300 border border-surface-800 rounded-lg text-xs font-medium transition-colors"
          title="Iniciar sesión de Deep Work"
        >
          <Timer className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden sm:inline">Modo Focus</span>
        </button>
      </div>
    </header>
  );
}
