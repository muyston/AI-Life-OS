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
  Check
} from "lucide-react";
import { format } from "date-fns";

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
    <div className="bg-surface-900 border border-surface-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-800 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-purple-950/70 border border-purple-800/80 flex items-center justify-center text-purple-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
              Agente de Planificacion
            </h3>
            <p className="text-[11px] text-surface-400">
              Cruza tareas pendientes con huecos libres en Google Calendar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRunPlanning}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/60 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isLoading ? "Analizando Agenda..." : "Calcular Plan de Trabajo"}
        </button>
      </div>

      {proposal ? (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="p-3.5 rounded bg-surface-950 border border-surface-800">
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
                Distribucion Horaria Recomendada
              </div>
              <div className="space-y-2">
                {proposal.assignments.map((item) => (
                  <div
                    key={item.taskId}
                    className="p-3 rounded bg-surface-950 border border-surface-800/80 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-surface-100">
                          {item.taskTitle}
                        </span>
                        {item.projectName && (
                          <span className="text-[10px] bg-surface-800 text-surface-400 px-1.5 py-0.2 rounded font-mono">
                            {item.projectName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-surface-400 mt-1">
                        {item.rationale}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-accent-400">
                        {format(new Date(item.assignedStart), "HH:mm")} - {format(new Date(item.assignedEnd), "HH:mm")}
                      </div>
                      <div className="text-[10px] text-surface-400 mt-0.5">
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
            <div className="p-3 rounded bg-amber-950/20 border border-amber-800/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tareas no asignadas en esta jornada
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
            <div className="p-3 rounded bg-surface-950 border border-surface-800 space-y-1 text-xs text-surface-400">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-300 uppercase tracking-wider">
                <Info className="w-3 h-3 text-accent-500" />
                Recomendaciones Tacticas
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-surface-400 pl-1">
                {proposal.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply Proposal CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-800">
            <span className="text-[11px] text-surface-400">
              {appliedSuccess
                ? "Plan aplicado exitosamente a las tareas de la base de datos."
                : "Aplicar guardara los bloques horarios en las tareas pendientes."}
            </span>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || proposal.assignments.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {appliedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Plan Aplicado
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {isApplying ? "Aplicando..." : "Confirmar y Aplicar Plan"}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-surface-400 space-y-2">
          <Bot className="w-6 h-6 text-surface-400 mx-auto" />
          <p>
            Pulsa en &quot;Calcular Plan de Trabajo&quot; para que el agente cruce tus tareas pendientes con tu calendario.
          </p>
        </div>
      )}
    </div>
  );
}
