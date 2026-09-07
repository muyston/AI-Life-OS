"use client";

import { useState } from "react";
import { PlanningAgentProposal } from "@/lib/types";
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Info, 
  Check,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { VisionScheduleButton } from "@/components/vision/VisionScheduleButton";

interface PlanningWidgetProps {
  proposal: PlanningAgentProposal | null;
  onRunPlanning: () => Promise<void>;
  onApplyPlan: (assignments: PlanningAgentProposal["assignments"]) => Promise<void>;
  isLoading: boolean;
}

export function PlanningWidget({
  proposal,
  onRunPlanning,
  onApplyPlan,
  isLoading,
}: PlanningWidgetProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleApply = async () => {
    if (!proposal || proposal.assignments.length === 0) return;
    try {
      setIsApplying(true);
      await onApplyPlan(proposal.assignments);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 4000);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-950/70 border border-purple-800/80 flex items-center justify-center text-purple-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
              Agente de Planificación Operativa
            </h3>
            <p className="text-[11px] text-surface-400">
              Cruza tareas pendientes con huecos libres en Google Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <VisionScheduleButton
            variant="pill"
            title="Importar horario de uni o rutina desde foto"
          />

          <button
            type="button"
            onClick={onRunPlanning}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/60 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isLoading ? "Analizando Agenda..." : "Calcular Plan"}</span>
          </button>
        </div>
      </div>

      {proposal ? (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="glass-card rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
              <span className="font-mono text-[11px]">
                Plan generado: {format(new Date(proposal.generatedAt), "HH:mm:ss")}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-brand-400 font-medium">
                  {proposal.tasksAssignedCount} asignadas
                </span>
                {proposal.unassignedTasksCount > 0 && (
                  <span className="text-amber-400 font-medium">
                    {proposal.unassignedTasksCount} sin hueco
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-surface-200">{proposal.summary}</p>
          </div>

          {/* Assignments List */}
          {proposal.assignments.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
                Distribución Horaria Asignada
              </div>
              <div className="space-y-2">
                {proposal.assignments.map((item) => (
                  <div
                    key={item.taskId}
                    className="p-3 rounded-xl bg-surface-950/80 border border-white/[0.06] flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-surface-100">
                          {item.taskTitle}
                        </span>
                        {item.projectName && (
                          <span className="text-[10px] bg-surface-800 text-surface-400 px-1.5 py-0.2 rounded-md font-mono">
                            {item.projectName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-surface-400 mt-1">
                        {item.rationale}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-accent-300 font-semibold">
                        {format(new Date(item.assignedStart), "HH:mm")} - {format(new Date(item.assignedEnd), "HH:mm")}
                      </div>
                      <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                        {item.slotDurationMinutes} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unassigned Tasks Warning */}
          {proposal.unassignedTasks.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Tareas no asignadas en esta jornada</span>
              </div>
              {proposal.unassignedTasks.map((u) => (
                <div key={u.taskId} className="text-[11px] text-amber-300/80 pl-5">
                  • <span className="font-medium">{u.taskTitle}</span>: {u.reason}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {proposal.recommendations.length > 0 && (
            <div className="glass-card rounded-xl p-3 space-y-1 text-xs text-surface-400">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-300 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-accent-400" />
                <span>Recomendaciones Tácticas</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-surface-400 pl-1">
                {proposal.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply Proposal CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] flex-wrap gap-2">
            <span className="text-[11px] text-surface-400">
              {appliedSuccess
                ? "Plan aplicado exitosamente a las tareas."
                : "Aplicar guardará los bloques horarios en tus tareas."}
            </span>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || proposal.assignments.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {appliedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Plan Aplicado</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isApplying ? "Aplicando..." : "Confirmar y Aplicar Plan"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-surface-400 space-y-3 glass-card rounded-xl p-4">
          <Bot className="w-6 h-6 text-surface-500 mx-auto" />
          <p className="max-w-md mx-auto">
            Pulsa en &quot;Calcular Plan&quot; para cruzar tus tareas con Google Calendar, o sube una foto de tu horario universitario para generar una rutina con gimnasio integrado.
          </p>
          <div className="pt-1 flex items-center justify-center">
            <VisionScheduleButton
              variant="button"
              title="Importar Horario con Foto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
