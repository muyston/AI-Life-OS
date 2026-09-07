"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Dumbbell, 
  User, 
  RefreshCw,
  Calendar,
  Check
} from "lucide-react";
import { RoutinePrediction, RoutinePredictionReport, ProjectCategory } from "@/lib/types";

const DOMAIN_CONFIG: Record<
  ProjectCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  tech: {
    label: "Tech & Coding",
    icon: Code2,
    color: "text-cyan-400",
    bg: "bg-cyan-950/40",
    border: "border-cyan-800/60",
  },
  business: {
    label: "Lanzing Business",
    icon: Briefcase,
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/60",
  },
  academic: {
    label: "Academico UPM",
    icon: GraduationCap,
    color: "text-blue-400",
    bg: "bg-blue-950/40",
    border: "border-blue-800/60",
  },
  performance: {
    label: "Performance / Fisico",
    icon: Dumbbell,
    color: "text-emerald-400",
    bg: "bg-emerald-950/40",
    border: "border-emerald-800/60",
  },
  personal: {
    label: "Personal & Reflexion",
    icon: User,
    color: "text-purple-400",
    bg: "bg-purple-950/40",
    border: "border-purple-800/60",
  },
};

export function RoutinePredictionWidget({
  onRoutinesApplied,
}: {
  onRoutinesApplied?: () => void;
}) {
  const [report, setReport] = useState<RoutinePredictionReport | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/routines/predictions", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setReport(data.data);
        setSelectedIds(data.data.predictions.map((p: RoutinePrediction) => p.id));
      }
    } catch (err) {
      console.error("Error al obtener predicciones de rutinas:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    if (selectedIds.length === 0 || isApplying) return;

    try {
      setIsApplying(true);
      setFeedback(null);
      const res = await fetch("/api/routines/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRoutineIds: selectedIds,
          targetDate: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback(data.message || `Planificadas ${selectedIds.length} rutinas en la agenda.`);
        setTimeout(() => setFeedback(null), 5000);
        if (onRoutinesApplied) onRoutinesApplied();
      } else {
        setFeedback("Error al planificar rutinas.");
      }
    } catch {
      setFeedback("Error de conexion al aplicar rutinas.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!report && isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-surface-800 rounded-lg" />
        <div className="h-20 bg-surface-900 rounded-xl" />
      </div>
    );
  }

  if (!report || report.predictions.length === 0) return null;

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-cyan-400 shadow-inner">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-surface-100 tracking-tight">
                Motor Predictivo de Rutinas
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60">
                {report.overallPredictabilityScore}% Previsibilidad
              </span>
            </div>
            <p className="text-[11px] text-surface-400 mt-0.5">
              Patrones recurrentes sintetizados a partir de tus habitos y eventos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPredictions}
            disabled={isLoading}
            className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-400 hover:text-surface-200 border border-white/10 transition-colors"
            title="Recalcular predicciones"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || selectedIds.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-cyan-600/20 active:scale-95 disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isApplying ? "Planificando..." : `Auto-Planificar (${selectedIds.length})`}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ willChange: "transform" }}
          className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </motion.div>
      )}

      {/* Grid de Rutinas Predictivas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {report.predictions.map((routine) => {
          const isSelected = selectedIds.includes(routine.id);
          const domainInfo = DOMAIN_CONFIG[routine.domain] || DOMAIN_CONFIG.tech;
          const DomainIcon = domainInfo.icon;

          return (
            <motion.div
              key={routine.id}
              whileHover={{ y: -2 }}
              style={{ willChange: "transform" }}
              onClick={() => toggleSelect(routine.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                isSelected
                  ? "bg-surface-900/90 border-cyan-500/40 shadow-md shadow-cyan-950/40"
                  : "bg-surface-950/70 border-white/[0.06] opacity-75 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${domainInfo.bg} ${domainInfo.color} ${domainInfo.border}`}
                  >
                    <DomainIcon className="w-3 h-3" />
                    <span>{domainInfo.label}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-surface-400">
                      {Math.round(routine.confidenceScore * 100)}%
                    </span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-cyan-500 border-cyan-400 text-surface-950"
                          : "border-white/20 bg-surface-900"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-surface-100 leading-snug">
                  {routine.name}
                </h4>

                <p className="text-[11px] text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                  {routine.reasoning}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-surface-300">
                <span className="flex items-center gap-1 text-cyan-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>
                    {routine.suggestedTimeStart} - {routine.suggestedTimeEnd}
                  </span>
                </span>
                <span className="text-surface-400">{routine.durationMinutes} min</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
