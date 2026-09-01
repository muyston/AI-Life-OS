"use client";

import { useState } from "react";
import {
  MultiSolutionAnalysis,
  SolverOption,
  CognitiveCostLevel,
  ProjectCategory,
  PriorityLevel,
} from "@/lib/types";
import {
  Zap,
  ShieldCheck,
  Bot,
  Clock,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
  CheckCircle2,
  Check,
  Loader2,
  Code2,
  Briefcase,
  GraduationCap,
  Dumbbell,
  User,
  Plus,
  Send,
  FolderKanban,
  CheckSquare,
  Sparkles,
} from "lucide-react";

interface MultiSolutionMatrixProps {
  ideaId: string;
  analysis: MultiSolutionAnalysis;
  onSolutionApplied?: () => void;
  isProcessing?: boolean;
}

export function MultiSolutionMatrix({
  ideaId,
  analysis,
  onSolutionApplied,
  isProcessing: parentProcessing,
}: MultiSolutionMatrixProps) {
  const [selectedTabMobile, setSelectedTabMobile] = useState<"option-a" | "option-b" | "option-c">("option-a");
  const [applyingOptionId, setApplyingOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ optionId: string; message: string; type: "success" | "error" } | null>(null);

  const handleApply = async (
    optionId: "option-a" | "option-b" | "option-c",
    mode: "DISPATCH_TO_AI_ACTIONS" | "MATERIALIZE_AS_TASKS" | "CREATE_PROJECT"
  ) => {
    try {
      setApplyingOptionId(`${optionId}-${mode}`);
      setFeedback(null);

      const res = await fetch(`/api/ideas/${ideaId}/apply-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedOptionId: optionId,
          mode,
          projectName: analysis.suggestedProjectName,
          category: analysis.targetCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Fallo al ejecutar la solución.");
      }

      setFeedback({
        optionId,
        message: data.message || "Solución aplicada correctamente.",
        type: "success",
      });

      if (onSolutionApplied) {
        onSolutionApplied();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        optionId,
        message: msg,
        type: "error",
      });
    } finally {
      setApplyingOptionId(null);
    }
  };

  const domainIcons: Record<ProjectCategory, React.ComponentType<{ className?: string }>> = {
    tech: Code2,
    business: Briefcase,
    academic: GraduationCap,
    performance: Dumbbell,
    personal: User,
  };

  const priorityColors: Record<PriorityLevel, string> = {
    LOW: "text-surface-400 bg-surface-800 border-surface-700",
    MEDIUM: "text-blue-400 bg-blue-950/60 border-blue-800/80",
    HIGH: "text-amber-400 bg-amber-950/60 border-amber-800/80",
    CRITICAL: "text-red-400 bg-red-950/60 border-red-800/80",
    URGENT: "text-red-400 bg-red-950/60 border-red-800/80",
  };

  const cognitiveCostBadge = (cost: CognitiveCostLevel) => {
    switch (cost) {
      case "LOW":
        return { label: "Bajo (80/20)", color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/70" };
      case "MEDIUM":
        return { label: "Medio (Moderado)", color: "text-amber-400 bg-amber-950/60 border-amber-800/70" };
      case "HIGH":
      default:
        return { label: "Alto (Profundo)", color: "text-purple-400 bg-purple-950/60 border-purple-800/70" };
    }
  };

  const optionTheme = (type: SolverOption["type"]) => {
    switch (type) {
      case "QUICK_WIN":
        return {
          icon: Zap,
          border: "border-emerald-800/70 hover:border-emerald-600/80",
          headerBg: "bg-emerald-950/40",
          badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-800",
          accentText: "text-emerald-400",
          buttonBg: "bg-emerald-600 hover:bg-emerald-500 text-white",
        };
      case "STRUCTURAL":
        return {
          icon: ShieldCheck,
          border: "border-cyan-800/70 hover:border-cyan-600/80",
          headerBg: "bg-cyan-950/40",
          badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-800",
          accentText: "text-cyan-400",
          buttonBg: "bg-cyan-600 hover:bg-cyan-500 text-white",
        };
      case "DELEGATED":
      default:
        return {
          icon: Bot,
          border: "border-purple-800/70 hover:border-purple-600/80",
          headerBg: "bg-purple-950/40",
          badgeColor: "bg-purple-950/70 text-purple-300 border-purple-800",
          accentText: "text-purple-400",
          buttonBg: "bg-purple-600 hover:bg-purple-500 text-white",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Diagnosis Banner */}
      <div className="bg-surface-950 border border-surface-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-400" />
            <span className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
              Diagnóstico Estratégico & Causa Raíz
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-surface-700 bg-surface-900 text-surface-300 uppercase">
            Dominio Principal: {analysis.targetCategory}
          </span>
        </div>

        <p className="text-xs text-surface-200 leading-relaxed">
          {analysis.executiveDiagnosis}
        </p>

        <div className="pt-2 border-t border-surface-800/80 flex items-start gap-2 text-[11px] text-surface-400">
          <span className="font-semibold text-surface-300 shrink-0">Causa Raíz:</span>
          <span>{analysis.rootCause}</span>
        </div>

        {analysis.keyVariables && analysis.keyVariables.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[10px] font-mono text-surface-500 uppercase">Variables Clave:</span>
            {analysis.keyVariables.map((v, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-2 py-0.5 bg-surface-900 text-surface-300 rounded border border-surface-800"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-brand-950/60 border-brand-800 text-brand-300"
              : "bg-rose-950/60 border-rose-800 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
            ) : (
              <span className="font-bold text-rose-400 shrink-0">!</span>
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-surface-400 hover:text-surface-200 text-xs font-mono"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Mobile Tab Selector */}
      <div className="flex lg:hidden items-center gap-1.5 p-1 bg-surface-950 border border-surface-800 rounded-lg overflow-x-auto">
        {analysis.solutions.map((sol) => {
          const isSelected = selectedTabMobile === sol.id;
          const theme = optionTheme(sol.type);
          const Icon = theme.icon;
          return (
            <button
              key={sol.id}
              type="button"
              onClick={() => setSelectedTabMobile(sol.id)}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded text-xs font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border ${
                isSelected
                  ? `${theme.badgeColor} font-semibold shadow-sm`
                  : "text-surface-400 hover:text-surface-200 border-transparent hover:bg-surface-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sol.type === "QUICK_WIN" ? "Vía Rápida" : sol.type === "STRUCTURAL" ? "Estructural" : "Delegación"}</span>
            </button>
          );
        })}
      </div>

      {/* 3-Column Decision Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {analysis.solutions.map((sol) => {
          const theme = optionTheme(sol.type);
          const Icon = theme.icon;
          const costBadge = cognitiveCostBadge(sol.tradeOffs.cognitiveCost);
          const isHiddenOnMobile = selectedTabMobile !== sol.id;

          const isDispatching = applyingOptionId === `${sol.id}-DISPATCH_TO_AI_ACTIONS`;
          const isTasks = applyingOptionId === `${sol.id}-MATERIALIZE_AS_TASKS`;
          const isProject = applyingOptionId === `${sol.id}-CREATE_PROJECT`;
          const isAnyApplying = applyingOptionId !== null || parentProcessing;

          return (
            <div
              key={sol.id}
              className={`bg-surface-950 border rounded-xl flex flex-col justify-between overflow-hidden transition-all shadow-md ${
                theme.border
              } ${isHiddenOnMobile ? "hidden lg:flex" : "flex"}`}
            >
              {/* Header */}
              <div className={`p-4 border-b border-surface-800/80 space-y-2.5 ${theme.headerBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${theme.badgeColor}`}>
                    {sol.badge}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-surface-300">
                    <Clock className="w-3.5 h-3.5 text-surface-400" />
                    <span>~{sol.tradeOffs.estimatedTimeHours}h</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-surface-100 leading-snug">
                  {sol.title}
                </h4>

                <p className="text-[11px] text-surface-300 leading-relaxed">
                  {sol.summary}
                </p>
              </div>

              {/* Body: Trade-offs & Multidomain Metrics */}
              <div className="p-4 space-y-4 flex-1">
                {/* Trade-offs Grid */}
                <div className="bg-surface-900/80 border border-surface-800 rounded-lg p-3 space-y-2.5">
                  <div className="text-[10px] font-mono uppercase text-surface-400 font-semibold tracking-wider">
                    Evaluación de Trade-Offs:
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-surface-500 block">Coste Cognitivo</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase inline-block mt-0.5 ${costBadge.color}`}>
                        {costBadge.label}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-surface-500 block">Probabilidad Éxito</span>
                      <span className="text-xs font-mono font-bold text-brand-400">
                        {sol.tradeOffs.successProbability}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-surface-800/60">
                    <span className="text-[10px] text-surface-500 block">Retorno Estimado (ROI):</span>
                    <p className="text-[11px] text-surface-300 mt-0.5 leading-tight">
                      {sol.tradeOffs.roiDescription}
                    </p>
                  </div>
                </div>

                {/* Multidomain Impact Badges */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-surface-400 font-semibold tracking-wider">
                    Impacto en Ecosistema:
                  </div>
                  <div className="space-y-1">
                    {sol.multidomainImpact.domainImpacts.map((d, idx) => {
                      const DomIcon = domainIcons[d.category] || Code2;
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[11px] text-surface-300 bg-surface-900/50 p-1.5 rounded border border-surface-800/60"
                        >
                          <DomIcon className="w-3.5 h-3.5 text-accent-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-mono text-[9px] uppercase px-1 rounded bg-surface-800 text-surface-400 mr-1.5">
                              {d.category}
                            </span>
                            <span className="text-surface-300 text-[11px]">{d.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Atomic Action List */}
                <div className="space-y-2 pt-1 border-t border-surface-800/80">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-surface-400 font-semibold">
                    <span>Lote de Acciones ({sol.actions.length})</span>
                    <span>Duración</span>
                  </div>

                  <div className="space-y-1.5">
                    {sol.actions.map((act, actIdx) => {
                      const pClass = priorityColors[act.priority] || priorityColors.MEDIUM;
                      return (
                        <div
                          key={actIdx}
                          className="p-2 rounded bg-surface-900/70 border border-surface-800/60 space-y-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-semibold text-surface-100 leading-snug">
                              {actIdx + 1}. {act.title}
                            </span>
                            <span className="text-[10px] font-mono text-surface-400 shrink-0">
                              {act.estimatedDuration}m
                            </span>
                          </div>
                          {act.description && (
                            <p className="text-[10px] text-surface-400 leading-relaxed line-clamp-2">
                              {act.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className={`text-[8px] font-mono px-1 rounded border uppercase ${pClass}`}>
                              {act.priority}
                            </span>
                            <span className="text-[8px] font-mono px-1 rounded bg-surface-800 text-surface-400 uppercase">
                              {act.actionType}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 1-Click Execution Footer */}
              <div className="p-3.5 border-t border-surface-800/80 bg-surface-900/90 space-y-2">
                {/* Primary Button: Dispatch to AI Action Feed */}
                <button
                  type="button"
                  onClick={() => handleApply(sol.id, "DISPATCH_TO_AI_ACTIONS")}
                  disabled={isAnyApplying}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 ${
                    theme.buttonBg
                  }`}
                  title="Envía todas las acciones al Feed del Dashboard para aprobación o ejecución de 1 clic"
                >
                  {isDispatching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Despachar a Feed de IA (1 Clic)</span>
                </button>

                {/* Secondary Actions Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApply(sol.id, "MATERIALIZE_AS_TASKS")}
                    disabled={isAnyApplying}
                    className="py-1.5 px-2 rounded bg-surface-950 hover:bg-surface-800 border border-surface-700 text-[11px] font-medium text-surface-200 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    title="Crear directamente como tareas en la bandeja operativa"
                  >
                    {isTasks ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckSquare className="w-3 h-3 text-brand-400" />
                    )}
                    <span>Crear Tareas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(sol.id, "CREATE_PROJECT")}
                    disabled={isAnyApplying}
                    className="py-1.5 px-2 rounded bg-surface-950 hover:bg-surface-800 border border-surface-700 text-[11px] font-medium text-surface-200 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    title="Crear un proyecto nuevo con estas tareas asociadas"
                  >
                    {isProject ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FolderKanban className="w-3 h-3 text-accent-400" />
                    )}
                    <span>Crear Proyecto</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
