"use client";

import { useState } from "react";
import { 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  Flame,
  ArrowRight
} from "lucide-react";
import { HabitAuditReport, HabitAuditRecommendation } from "@/app/api/habits/ai-audit/route";

interface HabitAiAuditPanelProps {
  onApplyRecommendation?: (rec: HabitAuditRecommendation) => void;
}

export function HabitAiAuditPanel({ onApplyRecommendation }: HabitAiAuditPanelProps) {
  const [report, setReport] = useState<HabitAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/habits/ai-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo generar la auditoría de hábitos.");
      }
      setReport(data.data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servicio de auditoría.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.08] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-surface-100">
              Auditoría y Optimización IA (Atomic Habits)
            </h2>
          </div>
          <p className="text-[11px] text-surface-400 font-mono">
            Análisis de adherencia, detección de hábitos en riesgo, apilamiento contextual y regla de 2 minutos
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAudit}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-surface-900 hover:bg-surface-800 border border-white/10 text-surface-200 hover:text-white rounded-xl text-xs font-medium transition-all shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : "text-surface-400"}`} />
          <span>{isLoading ? "Analizando consistencia..." : report ? "Actualizar Auditoría IA" : "Ejecutar Diagnóstico IA"}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!report && !isLoading && !error && (
        <div className="py-8 text-center space-y-2">
          <Layers className="w-8 h-8 text-surface-600 mx-auto" />
          <p className="text-xs text-surface-300 font-medium">
            Diagnóstico de sistemas y hábitos en reposo.
          </p>
          <p className="text-[11px] text-surface-500 max-w-md mx-auto">
            Ejecuta el diagnóstico para detectar cuellos de botella en tu rutina, hábitos con riesgo de interrupción y recomendaciones automáticas de habit stacking.
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Executive Overview & KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface-950/70 border border-white/[0.06] space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-surface-400 block">
                Índice de Consistencia Global
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {report.overallConsistencyScore} / 100
              </div>
              <div className="text-[11px] text-surface-400">
                Basado en el historial de los últimos 30 días
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-950/70 border border-white/[0.06] space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-surface-400 block">
                Hábitos en Riesgo Crítico
              </span>
              <div className={`text-2xl font-bold font-mono ${report.criticalAtRiskHabitsCount > 0 ? "text-amber-400" : "text-surface-200"}`}>
                {report.criticalAtRiskHabitsCount}
              </div>
              <div className="text-[11px] text-surface-400">
                {report.criticalAtRiskHabitsCount > 0 
                  ? "Requieren reducción de fricción inmediata"
                  : "Todos los hábitos mantienen tracción estable"}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-1 md:col-span-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-300 block">
                Principio Sistémico
              </span>
              <p className="text-xs text-surface-200 italic leading-relaxed pt-1">
                "{report.systemicPrinciple}"
              </p>
            </div>
          </div>

          {/* Executive Audit Diagnosis */}
          <div className="p-4 rounded-xl bg-surface-900/40 border border-white/[0.06]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-surface-400 block mb-1">
              Diagnóstico Ejecutivo
            </span>
            <p className="text-xs text-surface-300 leading-relaxed">
              {report.executiveAudit}
            </p>
          </div>

          {/* Recommendations Cards */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-surface-400 block">
              Estrategias de Apilamiento y Reducción de Fricción
            </span>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {report.recommendations.map((rec) => {
                const isHighRisk = rec.riskLevel === "HIGH";
                const isMedRisk = rec.riskLevel === "MEDIUM";

                return (
                  <div
                    key={rec.habitId}
                    className={`p-4 rounded-xl border transition-all space-y-3 bg-surface-950/80 ${
                      isHighRisk 
                        ? "border-rose-800/50 hover:border-rose-700/70" 
                        : isMedRisk 
                        ? "border-amber-800/40 hover:border-amber-700/60" 
                        : "border-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    {/* Top title & risk badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-surface-100">
                          {rec.habitTitle}
                        </h4>
                        <span className="text-[10px] font-mono text-surface-400 uppercase">
                          {rec.category}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                          isHighRisk
                            ? "bg-rose-950/60 text-rose-300 border-rose-800"
                            : isMedRisk
                            ? "bg-amber-950/60 text-amber-300 border-amber-800"
                            : "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                        }`}
                      >
                        Riesgo {rec.riskLevel}
                      </span>
                    </div>

                    {/* Habit Stacking */}
                    <div className="p-2.5 rounded-lg bg-surface-900/60 border border-white/[0.04] space-y-1">
                      <div className="text-[10px] text-surface-400 font-mono flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-cyan-400" />
                        <span>Apilamiento (Habit Stacking):</span>
                      </div>
                      <p className="text-[11px] text-surface-200">
                        {rec.stackedAfterHabit}
                      </p>
                    </div>

                    {/* 2-Minute Rule Version */}
                    <div className="p-2.5 rounded-lg bg-surface-900/60 border border-white/[0.04] space-y-1">
                      <div className="text-[10px] text-surface-400 font-mono flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Versión de 2 Minutos (Mínima Fricción):</span>
                      </div>
                      <p className="text-[11px] text-surface-200">
                        {rec.twoMinuteVersion}
                      </p>
                    </div>

                    {/* Tactical Advice */}
                    <p className="text-[11px] text-surface-400 italic">
                      Consejo: {rec.tacticalAdvice}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
